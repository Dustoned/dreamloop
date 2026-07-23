uniform float u_mvariant;
uniform float u_mzoom;
uniform float u_mzoomPhase;   // integral of u_mzoom: rate, not rescaled history
uniform float u_mtwist;
uniform float u_moffset;
uniform float u_miters;
uniform float u_mglow;

// Menger-style sponge, as a genuinely endless dive.
//
// The trick is which thing moves. Flying the camera toward a fixed sponge can
// never loop: the sponge has one real size, so sooner or later the camera has to
// come back, and that is the pull-back you could see. Instead the camera stands
// still and the STRUCTURE grows. The lattice repeats exactly every factor of 3,
// so the level ladder below starts at 3^k with k running 0 -> 1 and wrapping:
// when k passes 1 every level has slid exactly one rung and the picture is
// identical to k = 0. Nothing to hide, so nothing to see.
//
// Two things make that exact rather than nearly-exact:
//  - there is no bounding cube any more. A fixed outer box has a size of its own
//    and does not repeat, which is what broke the old wrap.
//  - the level number used for colour slides with k too (see lvl below), or the
//    palette would step a whole level at the seam even when the geometry did not.

float boxDE(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float crossDE(vec3 p) {
  vec3 a = abs(p);
  float da = max(a.x, a.y);
  float db = max(a.y, a.z);
  float dc = max(a.z, a.x);
  return min(da, min(db, dc)) - 1.0;
}

float de(vec3 p, mat2 rstep, float s0, out float trap, out float lvl) {
  // No outer box: this is an infinite lattice, and that is what lets it repeat.
  float d = -1e18;
  float s = s0;
  trap = 1e9;
  lvl = 0.0;
  mat2 rm = mat2(1.0, 0.0, 0.0, 1.0);
  int n = int(u_miters);
  for (int i = 0; i < 10; i++) {
    if (i >= n) break;
    vec3 a = mod(p * s, 2.0) - 1.0;
    s *= 3.0;
    vec3 r = abs(1.0 - u_moffset * 3.0 * abs(a));
    // Accumulate the per-level rotation instead of calling rot2 (a sin and a cos)
    // on every one of up to 900 inner iterations per pixel.
    rm = rstep * rm;
    r.xy = rm * r.xy;

    float c;
    if (u_mvariant < 0.5) {
      c = crossDE(r) / s;                                     // Sponge
    } else if (u_mvariant < 1.5) {
      c = (min(max(abs(r.x), abs(r.y)), abs(r.z)) - 1.0) / s; // Lattice (square shafts)
    } else if (u_mvariant < 2.5) {
      c = (boxDE(r, vec3(1.0)) - 0.35) / s;                   // Blocks (jerusalem cube)
    } else if (u_mvariant < 3.5) {
      // Girders: the cross with rounded, chamfered bars — a beefier lattice. Built
      // from the same cross void, so the central shaft stays open at every scale.
      c = (crossDE(r) - 0.28) / s;
    } else {
      // Weave: two crosses at right angles min'd together, an interlaced basket.
      // Both are cross voids, so their intersection keeps the axis clear too.
      c = min(crossDE(r), crossDE(r.yzx)) / s;
    }

    if (c > d) {
      d = c;
      // Continuous across the wrap: at k = 1 every level has moved up one rung,
      // so subtracting k keeps the colour where it was.
      lvl = float(i) + 1.0 - log(s0) / log(3.0);
    }
    trap = min(trap, length(r) * 0.35);
  }
  return d;
}

void main() {
  // k runs 0 -> 1 and wraps forever. One lap magnifies the lattice by exactly 3,
  // which is one period of its own self-similarity, so the wrap is invisible and
  // the dive never has to turn around.
  float k = fract(u_mzoomPhase * 0.06);
  float s0 = pow(3.0, k);

  vec2 sc = ctr(v_uv) * 1.7;
  // Rolling the screen is free: it turns the view without moving the camera off
  // the axis.
  sc = rot2(u_time * 0.05) * sc;
  // The camera stays put on the axis. Only the structure moves.
  //
  // It has to be the axis exactly. The camera no longer travels, so as the lattice
  // grows around it any off-axis position eventually ends up inside solid material
  // — which rendered as a fully black frame. The Menger construction removes the
  // central cross at every level, so the axis is void at every scale: this is an
  // infinite square shaft that stays open however far the dive goes.
  vec3 ro = vec3(0.0, 0.0, -2.0);
  vec3 rd = normalize(vec3(sc, 1.0));

  float dist = 0.0;
  float glow = 0.0;
  float hit = -1.0;
  float trap = 0.0;
  float lvl = 0.0;
  float steps = 0.0;
  float maxD = 9.0;

  mat2 rstep = rot2(u_mtwist * 0.5);
  int MARCH = marchSteps(34, 90);
  for (int i = 0; i < 90; i++) {
    if (i >= MARCH) break;
    vec3 p = ro + rd * dist;
    float tr, lv;
    float d = de(p, rstep, s0, tr, lv);
    glow += exp(-abs(d) * 33.0);
    // Stop at one pixel's worth of distance rather than a fixed epsilon: a
    // constant threshold resolves far-away detail finer than the screen can show
    // it, and that is what turned the sponge into sparkling noise.
    float eps = max(0.0009, dist * 0.7 / u_res.y);
    if (d < eps) {
      hit = dist;
      trap = tr;
      lvl = lv;
      steps = float(i);
      break;
    }
    dist += d * 0.85;
    if (dist > maxD) break;
  }

  vec3 col = vec3(0.0);
  if (hit > 0.0) {
    float ao = clamp(1.0 - steps / 90.0, 0.0, 1.0);
    ao = ao * ao * 0.8 + 0.2;
    // colour follows the fold level, so the endless dive keeps cycling the palette
    float t = lvl * 0.13 + trap * 0.5 + u_time * 0.02;
    col = pal(t) * ao * (0.35 + 0.85 * exp(-hit / 3.0));
    col += pal(t + 0.3) * pow(ao, 4.0) * 0.35;
  }
  col += pal(0.1 + trap * 0.4 + u_time * 0.025) * glow * u_mglow * 0.006;

  col = col / (1.0 + col * 0.3);
  fragColor = vec4(max(col, 0.0), 1.0);
}
