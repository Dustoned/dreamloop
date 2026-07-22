#define PI 3.14159265359
#define TAU 6.28318530718

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, int oct) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 8; i++) {
    if (i >= oct) break;
    v += a * vnoise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

/**
 * Raymarch step budget for the current Shader Detail setting. The loop keeps its
 * constant bound (drivers need that); this just ends it early.
 */
int marchSteps(int lo, int hi) {
  return int(mix(float(lo), float(hi), clamp(u_lodScale, 0.0, 1.0)) + 0.5);
}

/**
 * Endless one-way travel through a structure that is NOT self-similar, so a plain
 * fract() would jump. Returns 0->1 over most of the cycle, then races back to 0
 * in the last stretch. A dive built on this never freezes at the end of its range
 * and never cuts: it dives, whooshes back, and dives again.
 */
float diveCycle(float phase) {
  const float RETURN = 0.22;               // fraction of the cycle spent rewinding
  phase = fract(phase);
  if (phase < 1.0 - RETURN) return phase / (1.0 - RETURN);
  // Ease the way back. A linear return reversed direction at ten times the dive
  // speed the instant it began and stopped just as abruptly; smoothstep has zero
  // slope at both ends, so the pull-back swells and settles instead of snapping.
  float u = (phase - (1.0 - RETURN)) / RETURN;
  return 1.0 - smoothstep(0.0, 1.0, u);
}

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

/** Cheap 3D value noise: two 2D slices blended along z. */
float vnoise3(vec3 p) {
  float zi = floor(p.z);
  float zf = p.z - zi;
  zf = zf * zf * (3.0 - 2.0 * zf);
  float a = vnoise(p.xy + hash11(zi) * 57.31);
  float b = vnoise(p.xy + hash11(zi + 1.0) * 57.31);
  return mix(a, b, zf);
}

float fbm3(vec3 p, int oct) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    v += amp * vnoise3(p);
    p = vec3(mat2(1.6, 1.2, -1.2, 1.6) * p.xy, p.z * 2.1 + 7.7);
    amp *= 0.5;
  }
  return v;
}

/**
 * Palette lookup; the texture wraps, so t can be any float. Spread stretches the
 * gradient across the value range, shift scrolls it (global Colour Speed).
 */
vec3 pal(float t) {
  return textureLod(u_palette, vec2(t * u_palSpread + u_palShift, 0.5), 0.0).rgb;
}

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

/** Centered, aspect-corrected coords: y in [-0.5, 0.5], x scaled by aspect. */
vec2 ctr(vec2 uv) {
  return (uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
}

/** Mirror-fold an angle into a kaleidoscope segment of n slices. */
float foldAngle(float a, float n) {
  float seg = TAU / n;
  a = mod(a, seg);
  return abs(a - seg * 0.5);
}
