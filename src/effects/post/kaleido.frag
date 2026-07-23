uniform float u_ksegments;
uniform float u_kangle;
uniform float u_kspin;
uniform float u_kspinPhase;   // integral of u_kspin: a steady turn, rate not history
uniform float u_kmode;

void main() {
  vec2 uv;
  if (u_kmode < 1.5) {
    // Polar mirror fold (mode 0), or a single mirror axis (mode 1).
    float aspect = u_res.x / u_res.y;
    vec2 p = v_uv - 0.5;
    p.x *= aspect;
    float r = length(p);
    // The static Angle offsets by one segment over the full slider; the Spin adds
    // a continuous turn on top, so the kaleidoscope actually rotates — the single
    // most iconic trippy motion, which used to be impossible here.
    float a = atan(p.y, p.x)
            + u_kangle * TAU / max(u_ksegments, 1.0)
            + u_kspinPhase * 0.4;
    // Mode 1 folds against just two mirrors (a plain mirror), mode 0 the full rose.
    a = u_kmode < 0.5 ? foldAngle(a, u_ksegments) : abs(mod(a, TAU) - PI) - PI * 0.5;
    p = vec2(cos(a), sin(a)) * r;
    p.x /= aspect;
    uv = clamp(p + 0.5, 0.0, 1.0);
  } else {
    // 4-way quadrant mirror
    uv = 1.0 - abs(1.0 - 2.0 * v_uv);
  }
  fragColor = vec4(textureLod(u_src, uv, 0.0).rgb, 1.0);
}
