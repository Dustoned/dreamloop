uniform float u_mscale;
uniform float u_swirl;
uniform float u_detail;
uniform float u_flow;
uniform float u_contrast;

// IQ-style nested domain warp: f(p + k*f(p + k*f(p)))
void main() {
  vec2 p = ctr(v_uv) * u_mscale * 3.0;
  float t = u_time * 0.15 * (0.25 + u_flow);
  int oct = int(u_detail);

  vec2 q = vec2(
    fbm(p + t * vec2(0.31, 0.21), oct),
    fbm(p + vec2(5.2, 1.3) - t * vec2(0.19, 0.28), oct)
  );
  vec2 r = vec2(
    fbm(p + u_swirl * 2.2 * q + vec2(1.7, 9.2) + t * vec2(0.15, 0.12), oct),
    fbm(p + u_swirl * 2.2 * q + vec2(8.3, 2.8) - t * vec2(0.12, 0.18), oct)
  );
  float f = fbm(p + u_swirl * 2.2 * r, oct);

  float tt = clamp(f * 1.7 - 0.15, 0.0, 1.0);
  tt = pow(tt, u_contrast);
  vec3 col = pal(tt + length(r) * 0.35 + dot(q, q) * 0.15);
  fragColor = vec4(col, 1.0);
}
