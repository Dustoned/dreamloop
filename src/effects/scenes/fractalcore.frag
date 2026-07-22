uniform float u_ffly;
uniform float u_fflyPhase;   // integral of u_ffly: rate, not rescaled history
uniform float u_ffold;
uniform float u_fwarp;
uniform float u_fglow;
uniform float u_fiter2;
uniform float u_fmode;
uniform float u_fspin;
uniform float u_fspinPhase;   // integral of u_fspin: rate, not rescaled history
uniform float u_fwander;

// Raymarched kaleidoscopic IFS in endlessly repeating space.
// rm is computed once per frame in main(); calling rot2 here would burn a sin and
// a cos on every march step.
float de(vec3 p, mat2 rm, out float trap) {
  p = mod(p + 1.5, 3.0) - 1.5;
  float scale = u_ffold;
  float factor = 1.0;
  trap = 1e9;
  int n = int(u_fiter2);
  for (int i = 0; i < 9; i++) {
    if (i >= n) break;
    p = abs(p);
    if (p.x < p.y) p.xy = p.yx;
    if (p.x < p.z) p.xz = p.zx;
    if (p.y < p.z) p.yz = p.zy;
    p.xy = rm * p.xy;
    p = p * scale - vec3(scale - 1.0);
    factor *= scale;
    trap = min(trap, length(p));
  }
  return length(p) / factor * 0.9;
}

void main() {
  float t = u_fflyPhase;
  float rotA = u_fwarp * (0.35 + 0.25 * sin(u_time * 0.13));

  // Motion: Fly Through moves the camera; Zoom modes stay put and scale space,
  // which loops seamlessly because the fold repeats every 3 units.
  // This world is an endless 3-unit lattice: it repeats under translation, not
  // under scaling. The old "zoom" modes scaled the ray direction, which
  // normalize() divided straight back out, so all three rendered the identical
  // picture. Travel is what this geometry actually offers, so that is what the
  // modes now do — and every one of them runs forever without a seam.
  // The old flight path ran down the z-axis, where this lattice leaves only 0.004
  // units of clearance — after a few seconds the camera was inside the geometry
  // and the screen went to a flat dark wall. The cell corner is a genuine open
  // corridor: 0.65 units of clearance, and it holds across the whole Structure
  // and Morph range, so the flight can run forever.
  const vec2 CORRIDOR = vec2(1.5, 1.5);
  float wander = clamp(u_fwander, 0.0, 0.35);
  float z;
  if (u_fmode < 0.5) {
    z = t;                                  // Fly Through: forward, wandering
  } else if (u_fmode < 1.5) {
    z = t * 1.7;                            // Dive: same corridor, much faster
  } else if (u_fmode < 2.5) {
    z = -t;                                 // Reverse: pull back out
  } else {
    z = 4.5 * sin(t * 0.22);                // Drift: in and back out again
  }
  vec3 ro = vec3(CORRIDOR + wander * vec2(sin(t * 0.31), cos(t * 0.24)), z);
  float zoom = 1.0;

  vec2 sc = ctr(v_uv) * 1.8;
  sc = rot2(sin(t * 0.2) * 0.4 + u_fspinPhase * 0.2) * sc;
  vec3 rd = normalize(vec3(sc, 1.0));

  float dist = 0.0;
  float glow = 0.0;
  float hit = -1.0;
  float trap = 0.0;
  float steps = 0.0;
  mat2 rm = rot2(rotA);
  int MARCH = marchSteps(24, 64);
  float eps = 0.004 * zoom;   // stay a constant number of pixels wide as we dive
  float maxD = 12.0 * zoom;
  for (int i = 0; i < 64; i++) {
    if (i >= MARCH) break;
    vec3 p = ro + rd * dist;
    float tr;
    float d = de(p, rm, tr);
    glow += exp(-d * 14.0 / zoom);
    if (d < eps) {
      hit = dist;
      trap = tr;
      steps = float(i);
      break;
    }
    dist += d * 0.85;
    if (dist > maxD) break;
  }

  vec3 col = vec3(0.0);
  if (hit > 0.0) {
    float ao = 1.0 - steps / 64.0; // step-count ambient occlusion
    col = pal(trap * 1.4 + u_time * 0.02);
    col *= ao * (0.45 + 1.2 * exp(-hit * 0.28 / zoom));
  }
  col += pal(0.1 + trap * 0.4 + u_time * 0.025) * glow * u_fglow * 0.008;
  fragColor = vec4(col, 1.0);
}
