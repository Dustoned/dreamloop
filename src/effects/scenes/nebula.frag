uniform float u_ndrift;
uniform float u_ndensity;
uniform float u_ndetail;
uniform float u_nstars;
uniform float u_ncontrast;

// Volumetric flight through fbm gas clouds, stars behind.
void main() {
  vec2 sc = ctr(v_uv) * 1.6;
  float t = u_time * u_ndrift * 0.35;
  vec3 ro = vec3(0.0, 0.0, t);
  vec3 rd = normalize(vec3(sc, 1.0));
  rd.xy = rot2(sin(t * 0.18) * 0.25) * rd.xy;

  vec3 col = vec3(0.0);
  float trans = 1.0;
  float z = 0.4;
  int oct = int(u_ndetail);
  for (int i = 0; i < 40; i++) {
    vec3 p = ro + rd * z;
    float den = fbm3(p * 0.85, oct) - (0.92 - u_ndensity * 0.5);
    den = clamp(den * 3.2, 0.0, 1.0);
    if (den > 0.01) {
      vec3 c = pal(den * 1.1 + z * 0.07 + u_time * 0.015);
      col += c * (den * den * 0.7 + den * 0.5) * trans * 0.34;
      trans *= 1.0 - den * 0.3;
      if (trans < 0.04) break;
    }
    z += 0.24;
  }

  // stars shining through the gaps
  vec2 q = rd.xy / (abs(rd.z) + 0.3) * 7.0 + vec2(t * 0.4, 0.0);
  vec2 cell = floor(q);
  vec2 f = fract(q) - 0.5;
  vec2 jit = hash22(cell) - 0.5;
  float star = smoothstep(0.045, 0.0, length(f - jit * 0.7));
  star *= step(0.75, hash21(cell + 5.1));
  float tw = 0.6 + 0.4 * sin(u_time * (2.0 + 3.0 * hash21(cell)) + hash21(cell) * TAU);
  col += vec3(1.0) * star * tw * trans * u_nstars;

  col = pow(col, vec3(u_ncontrast));
  fragColor = vec4(col, 1.0);
}
