import type { GlContext } from './gl';
import { Program, buildPrelude } from './program';
import { RenderTarget, PingPong } from './renderTarget';
import { PaletteTexture } from '../palette/gradientTexture';
import {
  BLOOM_BLUR_FRAG,
  BLOOM_BRIGHT_FRAG,
  COMMON_GLSL,
  FINAL_FRAG,
  FLAME_FADE_FRAG,
  FLAME_SPLAT_FRAG,
  FLAME_SPLAT_VERT,
  TISSUE_SIM_FRAG,
  effectById,
} from '../effects';
import type { AudioFrame, EffectDef, ParamState, ParamValue } from '../state/types';

function num(v: ParamValue | undefined, fallback: number): number {
  return typeof v === 'number' ? v : fallback;
}

function hexToRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Fixed frame graph, evaluated every frame:
 *   scene pass -> sceneRT
 *   feedback pass (Echo & Trails; plain copy when disabled) -> feedback ping-pong
 *   enabled post effects -> post ping-pong
 *   final blit (vignette/grain/dither + audio pulse/flash/sparkle) -> canvas
 */
export class Engine {
  private readonly prelude: string;
  private readonly programs = new Map<string, Program>();
  private readonly finalProg: Program;
  private readonly sceneRT: RenderTarget;
  private readonly feedback: PingPong;
  private readonly post: PingPong;
  private readonly bloomHalf: PingPong;
  private sim: PingPong | null = null;
  private simSeeded = false;
  private feedbackPrimed = false;
  /** Persistent density buffer for the fractal-flame scene; null until first used. */
  private flameAccum: PingPong | null = null;
  private flameProg: Program | null = null;
  private flameFadeProg: Program | null = null;
  /** Real elapsed seconds this frame (unscaled), for frame-rate-independent decay. */
  private lastDt = 1 / 60;
  private readonly palette: PaletteTexture;
  private paletteKey = '';
  private lastScene = '';
  private lastNow = -1;
  private frameIdx = 0;
  /** Scaled time accumulator (global Speed applied CPU-side). */
  time = 0;
  /** Global colour scroll + stretch, folded into every pal() lookup. */
  private palShift = 0;
  private palSpread = 1;
  /** Written by the audio module each frame; zeros when no source is active. */
  audio: AudioFrame = { sub: 0, bass: 0, mid: 0, treble: 0, beat: 0 };
  /** Extra internal-resolution factor set by the auto-degrade logic (perf.ts). */
  degradeScale = 1;
  /** Whether the user has opted into automatic quality reduction at all. */
  private autoAdjust = false;
  /** The user's own Shader Detail dial. */
  private detailScale = 1;
  /** True while the active scene's shader is still linking. */
  compiling = false;
  private cssW: number;
  private cssH: number;

  constructor(
    private glc: GlContext,
    private getState: () => ParamState,
  ) {
    this.prelude = buildPrelude(COMMON_GLSL);
    this.finalProg = new Program(glc, FINAL_FRAG, this.prelude, 'final');
    this.sceneRT = new RenderTarget(glc, 2, 2);
    this.feedback = new PingPong(glc, 2, 2);
    this.post = new PingPong(glc, 2, 2);
    this.bloomHalf = new PingPong(glc, 2, 2);
    this.palette = new PaletteTexture(glc);

    // A zero size is never a real layout — it happens while the page is being
    // restored, hidden, or moved between displays. Keeping the last good size
    // avoids collapsing every render target to 2x2 and back.
    const canvas = glc.canvas;
    this.cssW = canvas.clientWidth || window.innerWidth || 1280;
    this.cssH = canvas.clientHeight || window.innerHeight || 720;
    const adopt = (w: number, h: number): void => {
      if (w > 0 && h > 0) {
        this.cssW = w;
        this.cssH = h;
      }
    };
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect;
        if (r) adopt(r.width, r.height);
      }).observe(canvas);
    } else {
      addEventListener('resize', () => adopt(canvas.clientWidth, canvas.clientHeight));
    }
  }

  private getAuxProgram(key: string, frag: string): Program | null {
    let p = this.programs.get(key);
    if (!p) {
      p = new Program(this.glc, frag, this.prelude, key);
      this.programs.set(key, p);
    }
    return p.ready() ? p : null;
  }

  /** Returns null while the program is still linking; the caller should skip it. */
  private getProgram(def: EffectDef): Program | null {
    let p = this.programs.get(def.id);
    if (!p) {
      p = new Program(this.glc, def.frag, this.prelude, def.id);
      this.programs.set(def.id, p);
    }
    return p.ready() ? p : null;
  }

  /** Start linking a shader ahead of time, without blocking. */
  warm(def: EffectDef): void {
    if (!this.programs.has(def.id)) {
      this.programs.set(def.id, new Program(this.glc, def.frag, this.prelude, def.id));
    }
  }

  /**
   * Running integral of every rate slider, keyed by param path. Advanced once per
   * frame in render(); uploadParams only reads it, because a frame can bind the
   * same program more than once.
   */
  private phases = new Map<string, number>();

  private advancePhases(st: ParamState, dt: number): void {
    const walk = (def: EffectDef | undefined, prefix: string): void => {
      if (!def) return;
      for (const pd of def.params) {
        if (pd.type !== 'slider' || !pd.integrate) continue;
        const path = prefix + pd.id;
        const base = (st.params[path] ?? pd.default) as number;
        const rate = this.modulated(st, path, base, pd.min, pd.max, def, pd.id);
        this.phases.set(path, (this.phases.get(path) ?? 0) + dt * rate);
      }
    };
    walk(effectById(st.scene), `scene.${st.scene}.`);
    for (const e of st.effects) {
      if (e.on) walk(effectById(e.id), `fx.${e.id}.`);
    }
  }

  private uploadParams(p: Program, def: EffectDef, st: ParamState, prefix: string): void {
    for (const pd of def.params) {
      const v = st.params[prefix + pd.id] ?? pd.default;
      const name = `u_${pd.id}`;
      switch (pd.type) {
        case 'slider': {
          let x = this.modulated(st, prefix + pd.id, v as number, pd.min, pd.max, def, pd.id);
          // Shader Detail is the user's own dial; auto-adjust only joins in when
          // they have asked for it.
          const detail = this.detailScale * (this.autoAdjust ? this.degradeScale : 1);
          if (pd.perfScale && detail < 1) {
            // Ease toward the cheap end; cost-3 scenes give up detail fastest.
            const give = def.cost >= 3 ? 1 : 0.6;
            const k = 1 - (1 - detail) * give;
            x = pd.min + (x - pd.min) * k;
            if (pd.step && pd.step >= 1) x = Math.max(pd.min, Math.round(x));
          }
          p.set1f(name, x);
          // Rate sliders also get their integral, which is what the shader uses
          // instead of u_time * u_<id>.
          if (pd.integrate) p.set1f(`${name}Phase`, this.phases.get(prefix + pd.id) ?? 0);
          break;
        }
        case 'toggle':
          p.set1f(name, v ? 1 : 0);
          break;
        case 'select':
          p.set1f(name, v as number);
          break;
        case 'color': {
          const [r, g, b] = hexToRgb01(v as string);
          p.set3f(name, r, g, b);
          break;
        }
      }
    }
  }

  /**
   * Apply a per-slider audio link. Computed here rather than written back to the
   * store, so presets and share codes always capture the user's base setting.
   */
  private modulated(
    st: ParamState,
    path: string,
    base: number,
    min: number,
    max: number,
    def: EffectDef,
    id: string,
  ): number {
    const amount = st.audio.amount;
    if (amount <= 0) return base;

    // An explicit link the user made wins over the effect's built-in response.
    const mod = st.mods[path];
    const band = mod ? mod.src : def.audioReact?.find((r) => r.id === id)?.band;
    if (!band) return base;
    const strength = mod ? mod.amt : (def.audioReact!.find((r) => r.id === id)!.amount);

    const v = base + strength * this.audio[band] * (max - min) * amount;
    return Math.min(max, Math.max(min, v));
  }

  private setStd(p: Program, w: number, h: number): void {
    p.set1f('u_time', this.time);
    p.set2f('u_res', w, h);
    p.set2f('u_texel', 1 / w, 1 / h);
    p.set1f('u_frame', this.frameIdx);
    const a = this.audio;
    p.set4f('u_audio', a.bass, a.mid, a.treble, a.beat);
    p.set1f('u_audioAmt', this.getState().audio.amount);
    p.set1f('u_palShift', this.palShift);
    p.set1f('u_palSpread', this.palSpread);
    p.set1f('u_lodScale', this.detailScale * (this.autoAdjust ? this.degradeScale : 1));
  }

  /**
   * The whole-frame musical accents, each a toggle scaled by the master amount.
   * Six numbers, uploaded as two vec3s. Bass Pulse rides SUB-bass, not the full
   * bass band, so it moves on the kick and the bassline rather than on anything
   * that merely has low-frequency content.
   */
  private audioFx(st: ParamState): { fx: [number, number, number]; fx2: [number, number, number] } {
    const amt = st.audio.amount;
    const m = st.audio.mappings;
    const a = this.audio;
    return {
      fx: [
        m.includes('bassPulse') ? amt * a.sub : 0,
        m.includes('beatFlash') ? amt * a.beat : 0,
        m.includes('trebleSparkle') ? amt * a.treble : 0,
      ],
      fx2: [
        m.includes('midSway') ? amt * a.mid : 0,
        m.includes('beatColour') ? amt * a.beat : 0,
        m.includes('beatPunch') ? amt * a.beat : 0,
      ],
    };
  }

  render(nowMs: number): void {
    const glc = this.glc;
    const canvas = glc.canvas;
    const st = this.getState();

    // Canvas backing store at CSS size × dpr. The CSS size comes from a
    // ResizeObserver rather than clientWidth, because reading that every frame
    // forces a synchronous layout — expensive whenever the panel is animating.
    // No device guess is applied here any more: the Resolution setting is the
    // single thing that decides how many pixels get rendered.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(2, Math.round(this.cssW * dpr));
    const ch = Math.max(2, Math.round(this.cssH * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    // Time step, scaled by the global Speed (pause-safe, tab-switch-safe).
    if (this.lastNow < 0) this.lastNow = nowMs;
    const dt = Math.min((nowMs - this.lastNow) / 1000, 0.1);
    this.lastNow = nowMs;
    this.lastDt = dt;
    this.time += dt * num(st.params['global.speed'], 1);
    // Rate sliders are integrated, so changing one bends the motion from here on
    // instead of rescaling everything that already happened.
    this.advancePhases(st, dt * num(st.params['global.speed'], 1));
    this.palShift += dt * num(st.params['global.colorspeed'], 0);
    this.palSpread = num(st.params['global.colorspread'], 1);
    this.autoAdjust = st.params['global.autoquality'] === true;
    this.detailScale = num(st.params['global.detail'], 1);

    // Palette LUT rebuild on change.
    const palKey = st.palette.stops.join(',');
    if (palKey !== this.paletteKey) {
      this.palette.update(st.palette.stops);
      this.paletteKey = palKey;
    }

    // Internal resolution. The scale is quantised to 5% steps so that dragging the
    // Resolution slider does not reallocate every texture on every frame;
    // quantising the factor rather than the pixel counts keeps the aspect exact.
    // Above 100% this supersamples, which is sharper than the display itself.
    const auto = this.autoAdjust ? this.degradeScale : 1;
    const rawScale = num(st.params['global.quality'], 1) * auto;
    let scale = Math.max(0.15, Math.round(rawScale * 20) / 20);
    // Guard rail: never allocate more than ~17M pixels per target, whatever the
    // slider says, or a big screen at 200% would exhaust memory.
    const maxPixels = 17e6;
    if (cw * ch * scale * scale > maxPixels) scale = Math.sqrt(maxPixels / (cw * ch));
    const iw = Math.max(64, Math.round(cw * scale));
    const ih = Math.max(64, Math.round(ch * scale));
    this.sceneRT.resize(iw, ih);

    // Only pay for the ping-pong targets that this configuration actually uses.
    const echoWanted = st.effects.find((e) => e.id === 'echo')?.on ?? false;
    const postWanted = st.effects.some(
      (e) => e.on && e.id !== 'echo' && e.id !== 'finish' && effectById(e.id)?.kind === 'post',
    );
    this.feedback.resize(echoWanted ? iw : 2, echoWanted ? ih : 2);
    this.post.resize(postWanted ? iw : 2, postWanted ? ih : 2);
    if (!postWanted) this.bloomHalf.resize(2, 2);

    // Stale trails look broken after a scene switch.
    if (st.scene !== this.lastScene) {
      this.lastScene = st.scene;
      this.feedback.clear();
      this.simSeeded = false;
      this.flameAccum?.clear();
    }

    // 1. Scene pass. If its shader is still linking, hold the last frame on screen
    // rather than blocking — the UI stays responsive while the driver works.
    const sceneDef = effectById(st.scene);
    if (!sceneDef) return;
    const sp = this.getProgram(sceneDef);
    if (!sp) {
      this.compiling = true;
      return;
    }
    this.compiling = false;
    if (sceneDef.passes === 'sim') this.runSim(st, sceneDef.id);
    if (sceneDef.passes === 'flame') {
      // Point-splatting scene: accumulate the chaos game, then tone-map into sceneRT.
      // `sp` here is the tone-map program (the scene def's frag).
      this.runFlame(st, sceneDef, sp, iw, ih);
    } else {
      sp.use();
      this.sceneRT.bind();
      this.setStd(sp, iw, ih);
      this.uploadParams(sp, sceneDef, st, `scene.${sceneDef.id}.`);
      sp.bindTex('u_palette', this.palette.tex, 0);
      if (this.sim && sceneDef.passes === 'sim') sp.bindTex('u_prev', this.sim.read.tex, 2);
      glc.drawFullscreen();
    }

    // 2. Feedback pass. With Echo off this pass is mathematically an identity
    // copy, so skip it entirely — that saves a full-screen pass every frame,
    // which is real money on a weak GPU.
    const echoOn = st.effects.find((e) => e.id === 'echo')?.on ?? false;
    let current: RenderTarget;
    const fp = echoOn ? this.getProgram(effectById('echo')!) : null;
    if (fp) {
      const echoDef = effectById('echo')!;
      fp.use();
      this.feedback.write.bind();
      this.setStd(fp, iw, ih);
      this.uploadParams(fp, echoDef, st, 'fx.echo.');
      fp.set1f('u_enabled', 1);
      fp.bindTex('u_palette', this.palette.tex, 0);
      fp.bindTex('u_src', this.sceneRT.tex, 1);
      fp.bindTex('u_prev', this.feedback.read.tex, 2);
      glc.drawFullscreen();
      this.feedback.swap();
      current = this.feedback.read;
      this.feedbackPrimed = true;
    } else {
      // History is stale the moment Echo comes back on; clear it once here so the
      // first re-enabled frame does not smear in an old image.
      if (this.feedbackPrimed) {
        this.feedback.clear();
        this.feedbackPrimed = false;
      }
      current = this.sceneRT;
    }

    // 3. Post chain in user order (echo/finish are orchestrated outside it).
    for (const e of st.effects) {
      if (!e.on || e.id === 'echo' || e.id === 'finish') continue;
      const def = effectById(e.id);
      if (!def || def.kind !== 'post') continue;

      if (def.passes === 'bloom') {
        current = this.renderBloom(st, current, iw, ih);
        continue;
      }

      const p = this.getProgram(def);
      if (!p) continue; // still linking — skip this effect for now
      p.use();
      this.post.write.bind();
      this.setStd(p, iw, ih);
      this.uploadParams(p, def, st, `fx.${def.id}.`);
      p.bindTex('u_palette', this.palette.tex, 0);
      p.bindTex('u_src', current.tex, 1);
      glc.drawFullscreen();
      this.post.swap();
      current = this.post.read;
    }

    this.renderFinal(st, current, cw, ch);
    this.frameIdx++;
  }

  /**
   * Fractal flame: a chaos-game IFS splatted as hundreds of thousands of additive
   * points into a persistent float density buffer that decays a little each frame,
   * then log-density tone-mapped into sceneRT so the rest of the pipeline is normal.
   * `tonemap` is the scene def's own program (its frag reads the density buffer).
   */
  private runFlame(st: ParamState, def: EffectDef, tonemap: Program, iw: number, ih: number): void {
    const glc = this.glc;
    const gl = glc.gl;
    const prefix = `scene.${def.id}.`;

    if (!this.flameAccum) {
      this.flameAccum = new PingPong(glc, iw, ih);
      this.flameAccum.clear(); // texImage2D leaves contents undefined; start at zero
    }
    this.flameAccum.resize(iw, ih);

    if (!this.flameProg) {
      this.flameProg = new Program(glc, FLAME_SPLAT_FRAG, this.prelude, 'flame:splat', {
        vert: FLAME_SPLAT_VERT,
        rawFrag: true,
      });
    }
    if (!this.flameFadeProg) {
      this.flameFadeProg = new Program(glc, FLAME_FADE_FRAG, this.prelude, 'flame:fade');
    }
    const splat = this.flameProg;
    const fade = this.flameFadeProg;
    // Hold the previous frame while the two custom programs are still linking.
    if (!splat.ready() || !fade.ready()) return;

    // 1. Fade the running density down, frame-rate-independent (read -> write).
    const trail = num(st.params[prefix + 'ftrail'], 0.5);
    const tau = 0.08 + trail * 0.55; // seconds of memory
    const decay = Math.exp(-this.lastDt / tau);
    fade.use();
    this.flameAccum.write.bind();
    gl.disable(gl.BLEND);
    this.setStd(fade, iw, ih);
    fade.set1f('u_decay', decay);
    fade.bindTex('u_src', this.flameAccum.read.tex, 1);
    glc.drawFullscreen();

    // 2. Splat the chaos game additively onto the just-faded buffer.
    const detail = this.detailScale * (this.autoAdjust ? this.degradeScale : 1);
    const dens = num(st.params[prefix + 'fdensity'], 1);
    const n = Math.max(4000, Math.min(240000, Math.round(dens * 90000 * detail)));
    splat.use();
    this.setStd(splat, iw, ih);
    this.uploadParams(splat, def, st, prefix);
    splat.bindTex('u_palette', this.palette.tex, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    glc.drawPoints(n);
    gl.disable(gl.BLEND);
    this.flameAccum.swap();

    // 3. Tone-map the density buffer into sceneRT.
    tonemap.use();
    this.sceneRT.bind();
    this.setStd(tonemap, iw, ih);
    this.uploadParams(tonemap, def, st, prefix);
    tonemap.bindTex('u_palette', this.palette.tex, 0);
    tonemap.bindTex('u_src', this.flameAccum.read.tex, 1);
    glc.drawFullscreen();
  }

  /** Gray-Scott sim steps at fixed 512²/256², independent of screen resolution. */
  private runSim(st: ParamState, sceneId: string): void {
    const glc = this.glc;
    const size = Math.min(window.innerWidth, window.innerHeight) < 720 ? 256 : 512;
    if (!this.sim) this.sim = new PingPong(glc, size, size);
    this.sim.resize(size, size);

    const def = effectById(sceneId)!;
    const prog = this.getAuxProgram('tissue:sim', TISSUE_SIM_FRAG);
    if (!prog) return;
    prog.use();

    if (!this.simSeeded) {
      this.simSeeded = true;
      this.sim.write.bind();
      this.setStd(prog, size, size);
      prog.set1f('u_seedMode', 1);
      glc.drawFullscreen();
      this.sim.swap();
    }

    // The sim is a fixed cost regardless of screen size, so it is one of the first
    // things to give up when the device is struggling.
    const base = Math.round((st.params[`scene.${sceneId}.simspeed`] as number) ?? 4);
    const steps = Math.max(1, Math.round(base * this.degradeScale));
    for (let i = 0; i < steps; i++) {
      prog.use();
      this.sim.write.bind();
      this.setStd(prog, size, size);
      this.uploadParams(prog, def, st, `scene.${sceneId}.`);
      prog.set1f('u_seedMode', 0);
      prog.bindTex('u_prev', this.sim.read.tex, 2);
      glc.drawFullscreen();
      this.sim.swap();
    }
  }

  /** Dual half-res Gaussian bloom: bright pass -> blur H -> blur V -> composite. */
  private renderBloom(st: ParamState, src: RenderTarget, iw: number, ih: number): RenderTarget {
    const glc = this.glc;
    const def = effectById('glow')!;
    const hw = Math.max(2, iw >> 1);
    const hh = Math.max(2, ih >> 1);
    this.bloomHalf.resize(hw, hh);
    const radius = ((st.params['fx.glow.bradius'] as number) ?? 1.2) * 2;

    const bright = this.getAuxProgram('glow:bright', BLOOM_BRIGHT_FRAG);
    const blur = this.getAuxProgram('glow:blur', BLOOM_BLUR_FRAG);
    const comp = this.getProgram(def);
    if (!bright || !blur || !comp) return src; // still linking — pass through
    bright.use();
    this.bloomHalf.write.bind();
    this.setStd(bright, hw, hh);
    this.uploadParams(bright, def, st, 'fx.glow.');
    bright.bindTex('u_src', src.tex, 1);
    glc.drawFullscreen();
    this.bloomHalf.swap();

    for (const dir of [
      [radius, 0],
      [0, radius],
    ]) {
      blur.use();
      this.bloomHalf.write.bind();
      this.setStd(blur, hw, hh);
      blur.set2f('u_dir', dir[0], dir[1]);
      blur.bindTex('u_src', this.bloomHalf.read.tex, 1);
      glc.drawFullscreen();
      this.bloomHalf.swap();
    }

    comp.use();
    this.post.write.bind();
    this.setStd(comp, iw, ih);
    this.uploadParams(comp, def, st, 'fx.glow.');
    comp.bindTex('u_src', src.tex, 1);
    comp.bindTex('u_bloom', this.bloomHalf.read.tex, 3);
    glc.drawFullscreen();
    this.post.swap();
    return this.post.read;
  }

  private renderFinal(st: ParamState, current: RenderTarget, cw: number, ch: number): void {
    const glc = this.glc;
    const gl = glc.gl;
    // Final blit to the canvas (vignette/grain/dither + audio effects).
    if (!this.finalProg.ready()) return;
    const finishDef = effectById('finish')!;
    const finishOn = st.effects.find((e) => e.id === 'finish')?.on ?? true;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cw, ch);
    this.finalProg.use();
    this.setStd(this.finalProg, cw, ch);
    this.uploadParams(this.finalProg, finishDef, st, 'fx.finish.');
    this.finalProg.set1f('u_enabled', finishOn ? 1 : 0);
    const { fx, fx2 } = this.audioFx(st);
    this.finalProg.set3f('u_audioFx', fx[0], fx[1], fx[2]);
    this.finalProg.set3f('u_audioFx2', fx2[0], fx2[1], fx2[2]);
    this.finalProg.set3f(
      'u_grade',
      num(st.params['global.brightness'], 1),
      num(st.params['global.contrast'], 1),
      num(st.params['global.saturation'], 1),
    );
    this.finalProg.set1f('u_hue', num(st.params['global.hue'], 0));
    this.finalProg.bindTex('u_src', current.tex, 1);
    glc.drawFullscreen();
  }
}
