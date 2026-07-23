uniform float u_density;
uniform float u_fly;
uniform float u_flyPhase;   // integral of u_fly: rate, not rescaled history
uniform float u_twinkle;
uniform float u_layers;
uniform float u_starsize;
uniform float u_streak;

void main() {
  vec2 p = ctr(v_uv);
  // faint drifting nebula behind the stars
  vec3 col = pal(fbm(p * 2.0 + u_time * 0.02, 3) * 0.4 + 0.05) * 0.13;

  int L = int(u_layers);
  for (int i = 0; i < 8; i++) {
    if (i >= L) break;
    float fi = float(i);
    float z = fract(u_flyPhase * 0.06 + fi / float(L)); // 0 far -> 1 near
    float scale = mix(20.0, 2.5, z);
    vec2 q = p * scale + vec2(fi * 17.13, fi * 9.7);
    vec2 cell = floor(q);
    vec2 f = fract(q) - 0.5;
    vec2 jitter = hash22(cell) - 0.5;
    vec2 e = f - jitter * 0.8;
    // Hyperspace streaks: stretch each star along the line out from the centre, so
    // near stars at high Fly Speed become warp lines. Anisotropic distance — the
    // along-centre component is compressed so more of it counts as "on the star".
    float streak = 1.0 + u_streak * (2.5 + u_fly * 3.5) * z * z;
    vec2 rdir = normalize(p + 1e-4);
    float along = dot(e, rdir) / streak;
    float perp = dot(e, vec2(-rdir.y, rdir.x));
    float d = length(vec2(along, perp));

    float bright = smoothstep(0.07 * u_starsize * (z + 0.25), 0.0, d);
    // Longer streaks are dimmer per pixel, so the total light stays roughly constant.
    bright /= sqrt(streak);
    bright *= step(1.0 - u_density * 0.75, hash21(cell + 31.7));
    float tw = 0.5 + 0.5 * sin(u_time * (2.0 + 4.0 * hash21(cell)) + hash21(cell) * TAU);
    bright *= mix(1.0, tw, u_twinkle);
    // fade at both depth ends so the wrap never pops
    bright *= smoothstep(0.0, 0.2, z) * (0.3 + 0.7 * z);

    col += pal(hash21(cell) + u_time * 0.02) * bright;
  }
  fragColor = vec4(col, 1.0);
}
