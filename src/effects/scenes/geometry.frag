uniform float u_gpattern;
uniform float u_thick;
uniform float u_grot;
uniform float u_gpulse;
uniform float u_gdensity;

void main() {
  vec2 p = ctr(v_uv) * 2.2;
  p = rot2(u_time * u_grot * 0.3) * p;
  vec2 q = p * u_gdensity;

  float d = 1e9;
  if (u_gpattern < 0.5) {
    // flower of life: hex lattice of unit circles (radius = spacing)
    mat2 B = mat2(1.0, 0.0, 0.5, 0.8660254);
    mat2 Binv = mat2(1.0, 0.0, -0.57735027, 1.15470054);
    vec2 base = floor(Binv * q);
    for (int i = -1; i <= 2; i++) {
      for (int j = -1; j <= 2; j++) {
        vec2 lp = B * (base + vec2(float(i), float(j)));
        float rr = 1.0 + u_gpulse * 0.08 * sin(u_time * 2.0 + length(lp) * 1.5);
        d = min(d, abs(length(q - lp) - rr));
      }
    }
  } else if (u_gpattern < 1.5) {
    // nested hexagon web
    vec2 a = abs(q - round(q / 2.0) * 2.0);
    float hex = max(a.x * 0.8660254 + a.y * 0.5, a.y);
    float ring = abs(fract(hex * 2.0 + u_gpulse * 0.5 * sin(u_time)) - 0.5) / 2.0;
    d = ring;
  } else {
    // concentric rings + spokes
    float r = length(q);
    float ring = abs(fract(r - u_time * 0.2 * (1.0 + u_gpulse)) - 0.5) / max(1.0, 1.0);
    float ang = atan(q.y, q.x);
    float spokes = abs(fract(ang / TAU * 12.0) - 0.5) * r * 0.5;
    d = min(ring * 0.8, spokes);
  }

  float line = smoothstep(u_thick, 0.0, d);
  float halo = exp(-d * 7.0) * 0.35;
  vec3 col = pal(d * 0.9 + length(p) * 0.15 + u_time * 0.03) * (line + halo);
  fragColor = vec4(col, 1.0);
}
