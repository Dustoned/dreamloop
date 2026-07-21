export class GlContext {
  readonly gl: WebGL2RenderingContext;
  readonly canvas: HTMLCanvasElement;
  /** Whether we can render into RGBA16F targets (needed for smooth feedback trails). */
  readonly halfFloat: boolean;

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
    gl.getExtension('KHR_parallel_shader_compile');
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
  }

  /** Draw the fullscreen triangle (positions generated from gl_VertexID, no buffers). */
  drawFullscreen(): void {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }
}

export function tryCreateGl(canvas: HTMLCanvasElement): GlContext | null {
  try {
    return new GlContext(canvas);
  } catch {
    return null;
  }
}
