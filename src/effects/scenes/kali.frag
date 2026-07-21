uniform float u_iter;
uniform float u_shapex;
uniform float u_shapey;
uniform float u_kzoom;
uniform float u_journey;

// Kali-set IFS; a ring orbit trap gives glowing filaments on a dark ground.
void main() {
  vec2 p = ctr(v_uv) * 2.0 / u_kzoom;
  float t = u_time * 0.12 * u_journey;
  vec2 c = vec2(u_shapex + 0.13 * sin(t * 1.3), u_shapey + 0.13 * cos(t * 0.9));

  float trap = 1e9;
  float acc = 0.0;
  int n = int(u_iter);
  for (int i = 0; i < 16; i++) {
    if (i >= n) break;
    p = abs(p) / dot(p, p) - c;
    float m = dot(p, p);
    trap = min(trap, abs(sqrt(m) - 0.35));
    acc += exp(-m * 2.5);
  }

  float glow = exp(-trap * 16.0);
  float v = acc / float(n);
  vec3 col = pal(v * 2.2 + sqrt(trap) * 1.4 + u_time * 0.02);
  col *= 0.15 + 1.05 * glow;
  col = pow(col, vec3(1.2));
  fragColor = vec4(col, 1.0);
}
