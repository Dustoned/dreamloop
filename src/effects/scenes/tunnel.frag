uniform float u_flyspeed;
uniform float u_flyspeedPhase;   // integral of u_flyspeed: rate, not rescaled history
uniform float u_twist;
uniform float u_repeat;
uniform float u_fog;
uniform float u_pattern;

void main() {
  vec2 p = ctr(v_uv);
  float r = length(p) + 1e-4;
  float a = atan(p.y, p.x) / TAU; // -0.5..0.5

  float depth = 0.3 / r;
  float z = depth + u_flyspeedPhase;
  float ang = a * u_repeat + depth * u_twist;

  float v;
  if (u_pattern < 0.5) {
    // rings & spokes
    v = 0.5 + 0.25 * sin(z * TAU) + 0.25 * sin(ang * TAU);
  } else if (u_pattern < 1.5) {
    // organic walls (mirrored angle to hide the polar seam)
    float am = abs(a) * 2.0;
    v = fbm(vec2(am * u_repeat * 0.5, z * 1.5), 4);
  } else {
    // checker
    float cx = step(0.5, fract(ang));
    float cz = step(0.5, fract(z));
    v = abs(cx - cz) * 0.75 + 0.12;
  }

  vec3 col = pal(v * 0.85 + u_time * 0.03);
  // depth fog: the far center fades to dark
  col *= mix(1.0, clamp(r * 2.4, 0.0, 1.0), u_fog);
  fragColor = vec4(col, 1.0);
}
