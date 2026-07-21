// M0 bootstrap: hardcoded plasma straight to the canvas to validate the toolchain.
// Replaced by the real engine + UI boot in M1/M2.
import { GlContext } from './engine/gl';
import { Program, buildPrelude } from './engine/program';
import { PaletteTexture } from './palette/gradientTexture';
import { PALETTES } from './palette/palettes';
import commonGlsl from './effects/shared/common.glsl?raw';
import plasmaFrag from './effects/scenes/plasma.frag?raw';
import './styles/app.css';

const canvas = document.getElementById('gl') as HTMLCanvasElement;
// preserveDrawingBuffer in dev so the canvas can be inspected headlessly.
const glc = new GlContext(canvas, { preserveDrawingBuffer: import.meta.env.DEV });
const prog = new Program(glc, plasmaFrag, buildPrelude(commonGlsl), 'plasma');
const palette = new PaletteTexture(glc);
palette.update(PALETTES.find((p) => p.id === 'neon')!.stops);

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

const t0 = performance.now();
function frame(): void {
  resize();
  const gl = glc.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  prog.use();
  prog.set1f('u_time', (performance.now() - t0) / 1000);
  prog.set2f('u_res', canvas.width, canvas.height);
  prog.set1f('u_scale', 1.0);
  prog.set1f('u_waves', 5);
  prog.set1f('u_wiggle', 0.8);
  prog.set1f('u_soft', 0.5);
  prog.bindTex('u_palette', palette.tex, 0);
  glc.drawFullscreen();
  schedule(frame);
}

// In dev, keep rendering (via setTimeout) even when the page reports hidden, so
// headless verification works. In production a hidden page simply pauses; the
// queued rAF fires again as soon as the page becomes visible.
function schedule(cb: () => void): void {
  if (import.meta.env.DEV && document.hidden) setTimeout(cb, 33);
  else requestAnimationFrame(cb);
}
schedule(frame);
