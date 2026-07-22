import type { GlContext } from './gl';

export class RenderTarget {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  width = 0;
  height = 0;

  constructor(
    private glc: GlContext,
    w: number,
    h: number,
    private useFloat = true,
  ) {
    const gl = glc.gl;
    this.tex = gl.createTexture()!;
    this.fbo = gl.createFramebuffer()!;
    this.alloc(w, h);
  }

  private alloc(w: number, h: number): void {
    const gl = this.glc.gl;
    const float = this.useFloat && this.glc.halfFloat && this.glc.allowFloatTargets;
    this.width = w;
    this.height = h;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      float ? gl.RGBA16F : gl.RGBA8,
      w,
      h,
      0,
      gl.RGBA,
      float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(w: number, h: number): void {
    if (w === this.width && h === this.height) return;
    this.alloc(w, h);
  }

  /**
   * Bind as draw target and set the viewport. Every pass overwrites 100% of its
   * target, so tell the driver not to load the old contents first — on tile-based
   * mobile GPUs that load is pure wasted bandwidth.
   */
  bind(): void {
    const gl = this.glc.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    if (this.glc.useInvalidate) gl.invalidateFramebuffer(gl.FRAMEBUFFER, [gl.COLOR_ATTACHMENT0]);
    gl.viewport(0, 0, this.width, this.height);
  }

  clear(): void {
    const gl = this.glc.gl;
    this.bind();
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  dispose(): void {
    const gl = this.glc.gl;
    gl.deleteTexture(this.tex);
    gl.deleteFramebuffer(this.fbo);
  }
}

export class PingPong {
  a: RenderTarget;
  b: RenderTarget;

  constructor(glc: GlContext, w: number, h: number, useFloat = true) {
    this.a = new RenderTarget(glc, w, h, useFloat);
    this.b = new RenderTarget(glc, w, h, useFloat);
  }

  get read(): RenderTarget {
    return this.a;
  }
  get write(): RenderTarget {
    return this.b;
  }

  swap(): void {
    const t = this.a;
    this.a = this.b;
    this.b = t;
  }

  resize(w: number, h: number): void {
    this.a.resize(w, h);
    this.b.resize(w, h);
  }

  clear(): void {
    this.a.clear();
    this.b.clear();
  }
}
