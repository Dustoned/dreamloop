uniform float u_sources;
uniform float u_freq;
uniform float u_wspeed;
uniform float u_orbit;
uniform float u_wcontrast;

void main() {
  vec2 p = ctr(v_uv);
  float t = u_time;
  float sum = 0.0;
  int n = int(u_sources);
  for (int i = 0; i < 8; i++) {
    if (i >= n) break;
    float fi = float(i);
    vec2 src = 0.35 * vec2(
      sin(t * (0.21 + 0.07 * fi) * u_orbit + fi * 2.4),
      cos(t * (0.17 + 0.05 * fi) * u_orbit + fi * 1.7)
    );
    sum += sin(length(p - src) * u_freq * TAU - t * u_wspeed * 2.0);
  }
  float tt = 0.5 + 0.5 * (sum / float(n));
  tt = pow(tt, u_wcontrast);
  fragColor = vec4(pal(tt + u_time * 0.02), 1.0);
}
