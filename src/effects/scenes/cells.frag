uniform float u_cellsize;
uniform float u_move;
uniform float u_movePhase;   // integral of u_move: rate, not rescaled history
uniform float u_edge;
uniform float u_smoothk;
uniform float u_cpulse;

// Animated Voronoi; the F2-F1 distance gives organic membranes.
void main() {
  vec2 p = ctr(v_uv) * 5.0 / u_cellsize;
  vec2 i = floor(p);
  vec2 f = fract(p);

  float f1 = 1e9;
  float f2 = 1e9;
  vec2 id1 = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash22(i + g);
      o = 0.5 + 0.42 * sin(u_movePhase + o * TAU);
      float d = length(g + o - f);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id1 = i + g;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }

  float membrane = f2 - f1;
  float cellId = hash21(id1);
  float breathe = 1.0 + u_cpulse * 0.3 * sin(u_time * 2.0 + cellId * TAU);

  vec3 inner = pal(cellId * 0.6 + u_time * 0.03 + f1 * 0.35);
  inner *= (0.55 + 0.55 * (1.0 - f1)) * breathe;
  float edge = smoothstep(u_edge + u_smoothk, u_edge, membrane);
  vec3 col = mix(inner, pal(cellId + 0.5 + u_time * 0.03) * 1.5, edge);
  fragColor = vec4(col, 1.0);
}
