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

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

/** Palette lookup; texture wraps, so t can be any float. */
vec3 pal(float t) {
  return texture(u_palette, vec2(t, 0.5)).rgb;
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
