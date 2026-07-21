import type { GlContext } from './gl';
import { Program, buildPrelude } from './program';
import { RenderTarget, PingPong } from './renderTarget';
import { PaletteTexture } from '../palette/gradientTexture';
import {
  BLOOM_BLUR_FRAG,
  BLOOM_BRIGHT_FRAG,
  COMMON_GLSL,
  FINAL_FRAG,
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
  private readonly palette: PaletteTexture;
  private paletteKey = '';
  private lastScene = '';
  private lastNow = -1;
  private frameIdx = 0;
  /** Scaled time accumulator (global Speed applied CPU-side). */
  time = 0;
  /** Written by the audio module each frame; zeros when no source is active. */
  audio: AudioFrame = { bass: 0, mid: 0, treble: 0, beat: 0 };
  /** Extra internal-resolution factor set by the auto-degrade logic (perf.ts). */
  degradeScale = 1;

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
  }

  private getAuxProgram(key: string, frag: string): Program {
    let p = this.programs.get(key);
    if (!p) {
      p = new Program(this.glc, frag, this.prelude, key);
      this.programs.set(key, p);
    }
    return p;
  }

  private getProgram(def: EffectDef): Program {
    let p = this.programs.get(def.id);
    if (!p) {
      p = new Program(this.glc, def.frag, this.prelude, def.id);
      this.programs.set(def.id, p);
    }
    return p;
  }

  private uploadParams(p: Program, def: EffectDef, st: ParamState, prefix: string): void {
    for (const pd of def.params) {
      const v = st.params[prefix + pd.id] ?? pd.default;
      const name = `u_${pd.id}`;
      switch (pd.type) {
        case 'slider':
          p.set1f(name, v as number);
          break;
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

  private setStd(p: Program, w: number, h: number): void {
    p.set1f('u_time', this.time);
    p.set2f('u_res', w, h);
    p.set2f('u_texel', 1 / w, 1 / h);
    p.set1f('u_frame', this.frameIdx);
    const a = this.audio;
    p.set4f('u_audio', a.bass, a.mid, a.treble, a.beat);
  }

  /** pulse, flash, sparkle — mapping toggles scaled by the master amount. */
  private audioFx(st: ParamState): [number, number, number] {
    const amt = st.audio.amount;
    const m = st.audio.mappings;
    const a = this.audio;
    return [
      m.includes('bassPulse') ? amt * a.bass : 0,
      m.includes('beatFlash') ? amt * a.beat : 0,
      m.includes('trebleSparkle') ? amt * a.treble : 0,
    ];
  }

  render(nowMs: number): void {
    const glc = this.glc;
    const canvas = glc.canvas;
    const st = this.getState();

    // Canvas backing store at CSS size × (capped) dpr.
    const mobile = Math.min(window.innerWidth, window.innerHeight) < 720;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    const cw = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const ch = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    // Time step, scaled by the global Speed (pause-safe, tab-switch-safe).
    if (this.lastNow < 0) this.lastNow = nowMs;
    const dt = Math.min((nowMs - this.lastNow) / 1000, 0.1);
    this.lastNow = nowMs;
    this.time += dt * num(st.params['global.speed'], 1);

    // Palette LUT rebuild on change.
    const palKey = st.palette.stops.join(',');
    if (palKey !== this.paletteKey) {
      this.palette.update(st.palette.stops);
      this.paletteKey = palKey;
    }

    // Internal resolution.
    const scale = num(st.params['global.quality'], 1) * this.degradeScale;
    const iw = Math.max(2, Math.round(cw * scale));
    const ih = Math.max(2, Math.round(ch * scale));
    this.sceneRT.resize(iw, ih);
    this.feedback.resize(iw, ih);
    this.post.resize(iw, ih);

    // Stale trails look broken after a scene switch.
    if (st.scene !== this.lastScene) {
      this.lastScene = st.scene;
      this.feedback.clear();
      this.simSeeded = false;
    }

    // 1. Scene pass.
    const sceneDef = effectById(st.scene);
    if (!sceneDef) return;
    const sp = this.getProgram(sceneDef);
    if (sceneDef.passes === 'sim') this.runSim(st, sceneDef.id);
    sp.use();
    this.sceneRT.bind();
    this.setStd(sp, iw, ih);
    this.uploadParams(sp, sceneDef, st, `scene.${sceneDef.id}.`);
    sp.bindTex('u_palette', this.palette.tex, 0);
    if (this.sim && sceneDef.passes === 'sim') sp.bindTex('u_prev', this.sim.read.tex, 2);
    glc.drawFullscreen();

    // 2. Feedback pass (always runs to keep the graph shape constant).
    const echoDef = effectById('echo')!;
    const echoOn = st.effects.find((e) => e.id === 'echo')?.on ?? false;
    const fp = this.getProgram(echoDef);
    fp.use();
    this.feedback.write.bind();
    this.setStd(fp, iw, ih);
    this.uploadParams(fp, echoDef, st, 'fx.echo.');
    fp.set1f('u_enabled', echoOn ? 1 : 0);
    fp.bindTex('u_palette', this.palette.tex, 0);
    fp.bindTex('u_src', this.sceneRT.tex, 1);
    fp.bindTex('u_prev', this.feedback.read.tex, 2);
    glc.drawFullscreen();
    this.feedback.swap();
    let current: RenderTarget = this.feedback.read;

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

  /** Gray-Scott sim steps at fixed 512²/256², independent of screen resolution. */
  private runSim(st: ParamState, sceneId: string): void {
    const glc = this.glc;
    const size = Math.min(window.innerWidth, window.innerHeight) < 720 ? 256 : 512;
    if (!this.sim) this.sim = new PingPong(glc, size, size);
    this.sim.resize(size, size);

    const def = effectById(sceneId)!;
    const prog = this.getAuxProgram('tissue:sim', TISSUE_SIM_FRAG);
    prog.use();

    if (!this.simSeeded) {
      this.simSeeded = true;
      this.sim.write.bind();
      this.setStd(prog, size, size);
      prog.set1f('u_seedMode', 1);
      glc.drawFullscreen();
      this.sim.swap();
    }

    const steps = Math.round((st.params[`scene.${sceneId}.simspeed`] as number) ?? 4);
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
    bright.use();
    this.bloomHalf.write.bind();
    this.setStd(bright, hw, hh);
    this.uploadParams(bright, def, st, 'fx.glow.');
    bright.bindTex('u_src', src.tex, 1);
    glc.drawFullscreen();
    this.bloomHalf.swap();

    const blur = this.getAuxProgram('glow:blur', BLOOM_BLUR_FRAG);
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

    const comp = this.getProgram(def);
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
    const finishDef = effectById('finish')!;
    const finishOn = st.effects.find((e) => e.id === 'finish')?.on ?? true;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cw, ch);
    this.finalProg.use();
    this.setStd(this.finalProg, cw, ch);
    this.uploadParams(this.finalProg, finishDef, st, 'fx.finish.');
    this.finalProg.set1f('u_enabled', finishOn ? 1 : 0);
    const [pulse, flash, sparkle] = this.audioFx(st);
    this.finalProg.set3f('u_audioFx', pulse, flash, sparkle);
    this.finalProg.bindTex('u_src', current.tex, 1);
    glc.drawFullscreen();
  }
}
