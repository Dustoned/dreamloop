uniform float u_ascale;
uniform float u_azoom;
uniform float u_azoomPhase;   // integral of u_azoom: rate, not rescaled history
uniform float u_aspin;
uniform float u_aspinPhase;   // integral of u_aspin: rate, not rescaled history
uniform float u_aiters;
uniform float u_athick;
uniform float u_aglow;

// Apollonian sphere packing (Iñigo Quilez's inversion fractal). The structure is
// self-similar under scaling by u_ascale, so cycling the zoom over exactly one
// log(u_ascale) period gives an endless dive with no visible reset.
float de(vec3 p, out float trap, out float gen) {
  float s = 1.0;
  trap = 1e9;
  gen = 0.0;
  int n = int(u_aiters);
  for (int i = 0; i < 12; i++) {
    if (i >= n) break;
    p = -1.0 + 2.0 * fract(0.5 * p + 0.5);
    float r2 = dot(p, p);
    trap = min(trap, r2);
    float k = u_ascale / max(r2, 0.06);
    p *= k;
    s *= k;
    gen += 1.0;
  }
  float thick = mix(0.18, 0.42, u_athick);
  return thick * abs(p.y) / s;
}

void main() {
  // Endless, one way, forever — by travelling rather than zooming.
  //
  // A seamless ZOOM is impossible here and that is not a tuning problem: de()
  // folds space with a lattice of fixed period 2 before it applies the packing
  // scale, so the structure is not self-similar under any factor. Measured both
  // ways: a wrap on log2(Packing) stepped 5.8x an ordinary frame, a wrap on a
  // clean factor of 2 stepped 5.2x. There is no seamless factor to find.
  //
  // What the lattice DOES repeat under is translation: every 2 units along any
  // axis the packing is identical. So the camera simply flies, forever, and the
  // wrap is exact rather than approximate. No reset, no pull-back, no fade.
  //
  // The flight line is not a guess. Reimplementing de() and scanning every lateral
  // offset for the minimum clearance over a full period gives one clear winner at
  // (-0.9167, -1.0): 0.30 units of room, holding to 0.22 at the top of the Packing
  // range. The origin axis, where it used to sit, measures 0.0000 — dead on the
  // surface, which is why it needed a zoom to stay out of trouble.
  const vec2 LANE = vec2(-0.9167, -1.0);
  float wander = 0.12;   // scan says clearance is still 0.264 this far off the line

  float t = u_azoomPhase * 0.55;
  vec3 ro = vec3(LANE + wander * vec2(sin(t * 0.23), cos(t * 0.19)), t);

  vec2 sc = ctr(v_uv) * 1.6;
  sc = rot2(u_aspinPhase * 0.15) * sc;
  vec3 rd = normalize(vec3(sc, 1.0));

  float dist = 0.0;
  float glow = 0.0;
  float hit = -1.0;
  float trap = 0.0;
  float gen = 0.0;
  float steps = 0.0;
  float maxD = 6.0;

  int MARCH = marchSteps(30, 80);
  for (int i = 0; i < 80; i++) {
    if (i >= MARCH) break;
    vec3 p = ro + rd * dist;
    float tr, g;
    float d = de(p, tr, g);
    glow += exp(-abs(d) * 50.0);
    // One pixel's worth of distance, so far detail is not resolved finer than the
    // screen can show it.
    float eps = max(0.0007, dist * 0.7 / u_res.y);
    if (d < eps) {
      hit = dist;
      trap = tr;
      gen = g;
      steps = float(i);
      break;
    }
    dist += d * 0.75;
    if (dist > maxD) break;
  }

  vec3 col = vec3(0.0);
  if (hit > 0.0) {
    float ao = clamp(1.0 - steps / 80.0, 0.0, 1.0);
    ao = ao * ao * 0.75 + 0.25;
    // each bubble generation gets its own hue; the dive cycles through them
    float ct = sqrt(trap) * 1.6 + gen * 0.06 + u_time * 0.02;
    col = pal(ct) * ao * (0.4 + 0.9 * exp(-hit * 0.4));
    col += pal(ct + 0.35) * pow(ao, 5.0) * 0.5; // rim highlight on the spheres
  }
  col += pal(0.2 + sqrt(trap) * 0.8 + u_time * 0.025) * glow * u_aglow * 0.005;

  col = col / (1.0 + col * 0.3);
  fragColor = vec4(max(col, 0.0), 1.0);
}
