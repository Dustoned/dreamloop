uniform float u_segments;
uniform float u_rotspeed;
uniform float u_suck;
uniform float u_detail;
uniform float u_mglow;

// Deep mandala: six rings of folded petals fly toward (or away from) you,
// counter-rotating per layer.
void main() {
  vec2 p = ctr(v_uv);
  float baseA = atan(p.y, p.x);
  float r = length(p) + 1e-4;

  vec3 col = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float ph = fract(u_time * u_suck * 0.09 + fi / 6.0); // 0 far -> 1 near
    float scale = mix(7.0, 0.45, ph * ph);
    float fade = smoothstep(0.0, 0.22, ph) * smoothstep(1.0, 0.82, ph);

    float dir = mod(fi, 2.0) < 1.0 ? 1.0 : -0.8;
    float a = baseA + u_time * u_rotspeed * (0.35 + fi * 0.12) * dir;
    a = foldAngle(a, u_segments);

    vec2 q = vec2(a * 3.0, r * scale + fi * 2.71);
    float v = fbm(q * 1.5, int(u_detail) + 1);
    float petal = smoothstep(0.45, 0.72, v);
    float glowv = exp(-abs(v - 0.58) * 7.0) * u_mglow;

    vec3 lay = pal(v * 0.9 + ph * 0.55 + fi * 0.17 + u_time * 0.02) * (petal + glowv);
    lay *= fade * (0.3 + 0.8 * ph); // nearer rings brighter
    col = col * (1.0 - fade * petal * 0.55) + lay;
  }

  col *= smoothstep(0.0, 0.035, r);
  fragColor = vec4(col, 1.0);
}
