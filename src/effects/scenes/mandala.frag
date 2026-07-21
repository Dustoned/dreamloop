uniform float u_segments;
uniform float u_rotspeed;
uniform float u_suck;
uniform float u_detail;
uniform float u_rings;

void main() {
  vec2 p = ctr(v_uv);
  float r = length(p) + 1e-5;
  float a = atan(p.y, p.x) + u_time * u_rotspeed * 0.6;
  a = foldAngle(a, u_segments);

  // log-polar: constant flow toward (or away from) the center
  float lr = log(r) * 1.2 - u_time * u_suck * 0.4;
  vec2 q = vec2(a * 4.0, lr);
  float v = fbm(q * 1.6, int(u_detail) + 2);
  v += u_rings * 0.4 * sin(lr * 7.0 + v * 3.0);

  vec3 col = pal(v + r * 0.25);
  col *= smoothstep(0.0, 0.03, r); // soften the center singularity
  fragColor = vec4(col, 1.0);
}
