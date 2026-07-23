export class GlContext {
  readonly gl: WebGL2RenderingContext;
  readonly canvas: HTMLCanvasElement;
  /** Whether we can render into RGBA16F targets (needed for smooth feedback trails). */
  readonly halfFloat: boolean;
  /** Present when the driver can link programs off the main thread. */
  readonly parallelCompile: { COMPLETION_STATUS_KHR: number } | null;
  /** Turned off by the device profile on weak GPUs — halves target bandwidth. */
  allowFloatTargets = true;
  /**
   * Discard a target's old contents before overwriting it. A real bandwidth win on
   * tile-based mobile GPUs; on desktop ANGLE it is at best a no-op, so it is only
   * enabled where it pays off.
   */
  useInvalidate = false;

  constructor(canvas: HTMLCanvasElement, opts: { preserveDrawingBuffer?: boolean } = {}) {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: opts.preserveDrawingBuffer ?? false,
    });
    if (!gl) throw new Error('webgl2-unavailable');
    this.gl = gl;
    this.canvas = canvas;
    this.halfFloat = !!(
      gl.getExtension('EXT_color_buffer_half_float') || gl.getExtension('EXT_color_buffer_float')
    );
    this.parallelCompile = gl.getExtension('KHR_parallel_shader_compile');
    // Needed to additively blend into float render targets (the fractal-flame
    // density buffer). Harmless to request where it is not required.
    gl.getExtension('EXT_float_blend');
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
  }

  /** Draw the fullscreen triangle (positions generated from gl_VertexID, no buffers). */
  drawFullscreen(): void {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  /** Draw n GL_POINTS with no vertex buffers; the vertex shader builds each from gl_VertexID. */
  drawPoints(n: number): void {
    this.gl.drawArrays(this.gl.POINTS, 0, n);
  }
}

export function tryCreateGl(canvas: HTMLCanvasElement): GlContext | null {
  try {
    return new GlContext(canvas);
  } catch {
    return null;
  }
}
