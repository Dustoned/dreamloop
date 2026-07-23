import type { GlContext } from './gl';

const VERT = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** Standard uniforms + varyings available to every effect shader. */
const STD_HEADER = `
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_texel;
uniform float u_frame;
uniform vec4 u_audio;      // bass, mid, treble, beat (0..1), unscaled
uniform float u_audioAmt;  // master Audio Reactivity, 0..1
uniform vec3 u_audioFx2;   // extra whole-frame accents: sway, colour-kick, spare
uniform float u_palShift;  // global Colour Speed scroll, applied inside pal()
uniform float u_palSpread; // global Colour Spread, applied inside pal()
uniform float u_lodScale;  // 0..1 Shader Detail; scene params are u_<paramId>
uniform sampler2D u_palette;
uniform sampler2D u_src;
uniform sampler2D u_prev;
in vec2 v_uv;
out vec4 fragColor;
`;

/** Builds the shared prelude injected before every fragment shader body. */
export function buildPrelude(commonGlsl: string): string {
  return STD_HEADER + '\n' + commonGlsl;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
  label: string,
): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  // Deliberately NOT querying COMPILE_STATUS here: that call blocks until the
  // driver has finished compiling, which is exactly the multi-second main-thread
  // stall this whole design exists to avoid. Errors surface from the link check
  // instead, and reportShaderError() below digs out the details only then.
  return sh;
}

/** Called only after a link failure, where blocking no longer matters. */
function reportShaderError(
  gl: WebGL2RenderingContext,
  sh: WebGLShader | null,
  src: string,
  label: string,
): void {
  if (!sh || gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return;
  const numbered = src
    .split('\n')
    .map((l, i) => `${i + 1}: ${l}`)
    .join('\n');
  console.error(
    `[dreamloop] shader compile failed (${label}):\n${gl.getShaderInfoLog(sh)}\n${numbered}`,
  );
}

export class Program {
  readonly prog: WebGLProgram;
  private readonly gl: WebGL2RenderingContext;
  private readonly glc: GlContext;
  private readonly label: string;
  private readonly locs = new Map<string, WebGLUniformLocation | null>();
  private state: 'linking' | 'ready' | 'failed' = 'linking';
  private readonly deadline: number;
  private readonly fragSrc: string;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  /** Give the driver this long to report completion before we block and wait. */
  private static readonly PATIENCE_MS = 1500;

  /**
   * Kicks off compile + link but does NOT wait for the result. Querying LINK_STATUS
   * forces the driver to finish, which on weak hardware blocks the main thread for
   * seconds — the app would look completely frozen. Call ready() on later frames
   * instead and keep drawing the previous scene until it returns true.
   */
  private readonly vertSrc: string;

  /**
   * `opts.vert` supplies a custom vertex shader (default: the fullscreen triangle).
   * `opts.rawFrag` uses fragBody verbatim as the whole fragment source instead of
   * wrapping it with the standard prelude — both needed by the flame splat pass,
   * which draws points through its own vertex shader and a minimal fragment shader.
   */
  constructor(
    glc: GlContext,
    fragBody: string,
    prelude: string,
    label = 'shader',
    opts: { vert?: string; rawFrag?: boolean } = {},
  ) {
    const gl = glc.gl;
    this.gl = gl;
    this.glc = glc;
    this.label = label;
    this.vertSrc = opts.vert ?? VERT;
    this.fragSrc = opts.rawFrag
      ? fragBody
      : `#version 300 es\nprecision highp float;\nprecision highp int;\n${prelude}\n${fragBody}`;
    const vs = compileShader(gl, gl.VERTEX_SHADER, this.vertSrc, `${label}.vert`);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, this.fragSrc, `${label}.frag`);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    // Keep the handles so a link failure can still be explained precisely.
    this.vs = vs;
    this.fs = fs;
    this.prog = prog;
    this.deadline = performance.now() + Program.PATIENCE_MS;
  }

  private releaseShaders(): void {
    if (this.vs) this.gl.deleteShader(this.vs);
    if (this.fs) this.gl.deleteShader(this.fs);
    this.vs = null;
    this.fs = null;
  }

  /** True once the program is linked and usable. Cheap to call every frame. */
  ready(): boolean {
    if (this.state !== 'linking') return this.state === 'ready';
    const gl = this.gl;
    const ext = this.glc.parallelCompile;
    // Without the extension we have no choice but to block once, here. We also stop
    // waiting past the deadline: some drivers never flip the completion flag, and a
    // one-off stall is far better than a canvas that stays black forever.
    if (
      ext &&
      performance.now() < this.deadline &&
      !gl.getProgramParameter(this.prog, ext.COMPLETION_STATUS_KHR)
    ) {
      return false;
    }

    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      reportShaderError(gl, this.fs, this.fragSrc, `${this.label}.frag`);
      reportShaderError(gl, this.vs, this.vertSrc, `${this.label}.vert`);
      console.error(
        `[dreamloop] program link failed (${this.label}): ${gl.getProgramInfoLog(this.prog)}`,
      );
      this.releaseShaders();
      gl.deleteProgram(this.prog);
      this.state = 'failed';
      return false;
    }
    const n = gl.getProgramParameter(this.prog, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(this.prog, i)!;
      this.locs.set(info.name, gl.getUniformLocation(this.prog, info.name));
    }
    this.releaseShaders();
    this.state = 'ready';
    return true;
  }

  get failed(): boolean {
    return this.state === 'failed';
  }

  use(): void {
    this.gl.useProgram(this.prog);
  }

  loc(name: string): WebGLUniformLocation | null {
    return this.locs.get(name) ?? null;
  }

  set1f(name: string, x: number): void {
    const l = this.loc(name);
    if (l) this.gl.uniform1f(l, x);
  }
  set2f(name: string, x: number, y: number): void {
    const l = this.loc(name);
    if (l) this.gl.uniform2f(l, x, y);
  }
  set3f(name: string, x: number, y: number, z: number): void {
    const l = this.loc(name);
    if (l) this.gl.uniform3f(l, x, y, z);
  }
  set4f(name: string, x: number, y: number, z: number, w: number): void {
    const l = this.loc(name);
    if (l) this.gl.uniform4f(l, x, y, z, w);
  }
  set1i(name: string, x: number): void {
    const l = this.loc(name);
    if (l) this.gl.uniform1i(l, x);
  }
  setMat3(name: string, m: Float32Array): void {
    const l = this.loc(name);
    if (l) this.gl.uniformMatrix3fv(l, false, m);
  }
  /** Bind a texture to a unit and point the sampler uniform at it. */
  bindTex(name: string, tex: WebGLTexture | null, unit: number): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    this.set1i(name, unit);
  }

  dispose(): void {
    this.gl.deleteProgram(this.prog);
  }
}
