uniform float u_ksegments;
uniform float u_kangle;
uniform float u_kmode;

void main() {
  vec2 uv;
  if (u_kmode < 0.5) {
    // polar mirror fold
    float aspect = u_res.x / u_res.y;
    vec2 p = v_uv - 0.5;
    p.x *= aspect;
    float r = length(p);
    // The fold repeats every TAU/segments, so offsetting by a whole TAU changed
    // nothing at all — the slider only did something over its first few percent.
    // One full slider now sweeps exactly one segment.
    float a = atan(p.y, p.x) + u_kangle * TAU / max(u_ksegments, 1.0);
    a = foldAngle(a, u_ksegments);
    p = vec2(cos(a), sin(a)) * r;
    p.x /= aspect;
    uv = clamp(p + 0.5, 0.0, 1.0);
  } else {
    // 4-way quadrant mirror
    uv = 1.0 - abs(1.0 - 2.0 * v_uv);
  }
  fragColor = vec4(textureLod(u_src, uv, 0.0).rgb, 1.0);
}
