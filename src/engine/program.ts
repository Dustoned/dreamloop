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
uniform vec4 u_audio; // bass, mid, treble, beat (0..1)
uniform float u_palShift;  // global Colour Speed scroll, applied inside pal()
uniform float u_palSpread; // global Colour Spread, applied inside pal()
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
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    const numbered = src
      .split('\n')
      .map((l, i) => `${i + 1}: ${l}`)
      .join('\n');
    console.error(`[dreamloop] shader compile failed (${label}):\n${log}\n${numbered}`);
    gl.deleteShader(sh);
    throw new Error(`shader-compile-failed:${label}`);
  }
  return sh;
}

export class Program {
  readonly prog: WebGLProgram;
  private readonly gl: WebGL2RenderingContext;
  private readonly locs = new Map<string, WebGLUniformLocation | null>();

  constructor(glc: GlContext, fragBody: string, prelude: string, label = 'shader') {
    const gl = glc.gl;
    this.gl = gl;
    const fragSrc = `#version 300 es\nprecision highp float;\nprecision highp int;\n${prelude}\n${fragBody}`;
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT, `${label}.vert`);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc, `${label}.frag`);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      console.error(`[dreamloop] program link failed (${label}): ${log}`);
      throw new Error(`program-link-failed:${label}`);
    }
    this.prog = prog;
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i)!;
      this.locs.set(info.name, gl.getUniformLocation(prog, info.name));
    }
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
