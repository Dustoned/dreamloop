import type { GlContext } from '../engine/gl';

// sRGB <-> OKLab, standard constants (Björn Ottosson).
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type Vec3 = [number, number, number];

function rgbToOklab([r, g, b]: Vec3): Vec3 {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: Vec3): Vec3 {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clamp01(linearToSrgb(clamp01(lr))),
    clamp01(linearToSrgb(clamp01(lg))),
    clamp01(linearToSrgb(clamp01(lb))),
  ];
}

/**
 * Build a 256x1 RGBA LUT from evenly spaced color stops, interpolated in OKLab.
 * The gradient wraps (last stop blends back into the first) so palette cycling
 * never jumps.
 */
export function buildPaletteLut(stops: string[], size = 256): Uint8Array {
  const labs = stops.map((s) => rgbToOklab(hexToRgb(s)));
  const n = labs.length;
  const out = new Uint8Array(size * 4);
  for (let i = 0; i < size; i++) {
    const t = (i / size) * n; // n segments incl. wraparound
    const seg = Math.floor(t) % n;
    const next = (seg + 1) % n;
    const f = t - Math.floor(t);
    const a = labs[seg];
    const b = labs[next];
    const lab: Vec3 = [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
    const [r, g, bl] = oklabToRgb(lab);
    out[i * 4] = Math.round(r * 255);
    out[i * 4 + 1] = Math.round(g * 255);
    out[i * 4 + 2] = Math.round(bl * 255);
    out[i * 4 + 3] = 255;
  }
  return out;
}

/** CSS linear-gradient string for previewing a stop list in the UI. */
export function paletteCss(stops: string[]): string {
  const pts = [...stops, stops[0]];
  return `linear-gradient(90deg, ${pts
    .map((s, i) => `${s} ${((i / (pts.length - 1)) * 100).toFixed(1)}%`)
    .join(', ')})`;
}

export class PaletteTexture {
  readonly tex: WebGLTexture;

  constructor(private glc: GlContext) {
    const gl = glc.gl;
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  update(stops: string[]): void {
    const gl = this.glc.gl;
    const lut = buildPaletteLut(stops);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, lut);
  }
}
