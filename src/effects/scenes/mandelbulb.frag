uniform float u_bpower;
uniform float u_bmorph;
uniform float u_bcam;
uniform float u_bspeed;
uniform float u_bdist;
uniform float u_biters;
uniform float u_bglow;

// Raymarched Mandelbulb: z -> z^n + c in spherical coords, with the running
// derivative dr turned into a distance estimate 0.5 * log(r) * r / dr.
// trap = closest approach of the orbit to the origin -> smooth, band-free colour.
float bulbDE(vec3 pos, float power, int iters, out float trap) {
  vec3 z = pos;
  float dr = 1.0;
  float r = length(z);
  float tr = 1e9;
  for (int i = 0; i < 12; i++) {
    if (i >= iters) break;
    r = length(z);
    if (r > 2.0) break;
    float invr = 1.0 / max(r, 1e-8);
    float zo = asin(clamp(z.z * invr, -1.0, 1.0)) * power;
    float zi = atan(z.y, z.x) * power;
    float rp = pow(r, power - 1.0); // one pow feeds both dr and the new radius
    dr = rp * dr * power + 1.0;
    float zr = rp * r;
    z = zr * vec3(cos(zo) * cos(zi), cos(zo) * sin(zi), sin(zo)) + pos;
    tr = min(tr, dot(z, z));
  }
  trap = sqrt(clamp(tr, 0.0, 4.0));
  r = max(r, 1e-6);
  return 0.5 * log(r) * r / max(dr, 1e-6);
}

// Tetrahedral gradient of the distance estimator: exactly 4 taps.
vec3 bulbNormal(vec3 p, float power, int iters, float h) {
  vec2 k = vec2(1.0, -1.0);
  float tr;
  return normalize(
    k.xyy * bulbDE(p + k.xyy * h, power, iters, tr) +
    k.yyx * bulbDE(p + k.yyx * h, power, iters, tr) +
    k.yxy * bulbDE(p + k.yxy * h, power, iters, tr) +
    k.xxx * bulbDE(p + k.xxx * h, power, iters, tr));
}

void main() {
  // The creature breathes: the exponent drifts, clamped so the DE stays sane.
  float power = clamp(u_bpower + u_bmorph * 3.0 * sin(u_time * 0.13), 1.6, 16.0);
  int iters = int(clamp(u_biters, 4.0, 12.0));

  // ---- camera: 0 Orbit, 1 Zoom In, 2 Ping-Pong, 3 Hold ---------------------
  float nearD = 1.22;                    // ~1.05 x surface radius: never enters
  float farD = max(u_bdist, nearD + 0.06);
  float camDist = farD;
  float orbMul = 0.35;
  if (u_bcam < 0.5) {
    orbMul = 1.0;                                                       // Orbit
  } else if (u_bcam < 1.5) {
    camDist = mix(farD, nearD, 1.0 - exp(-u_time * u_bspeed * 0.09));   // Zoom In
  } else if (u_bcam < 2.5) {
    camDist = mix(farD, nearD, 0.5 - 0.5 * cos(u_time * u_bspeed * 0.18)); // Ping-Pong
  }                                                                     // else Hold
  camDist = max(camDist, nearD);

  // a slow orbit always runs, so no mode ever looks frozen
  float ang = 0.9 + u_time * (0.03 + u_bspeed * 0.25 * orbMul);
  float elev = 0.16 + 0.30 * sin(u_time * (0.02 + u_bspeed * 0.06));
  vec3 ro = vec3(cos(ang) * cos(elev), sin(elev), sin(ang) * cos(elev)) * camDist;

  vec3 fwd = normalize(-ro);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);
  vec2 sc = ctr(v_uv) * 1.15; // tighter framing so the bulb fills the screen
  vec3 rd = normalize(fwd + right * sc.x + up * sc.y);

  // ---- bounding sphere: skip the empty space, keeps the step budget small --
  const float BR = 1.5;
  float bb = dot(ro, rd);
  float cc = dot(ro, ro) - BR * BR;
  float hh = bb * bb - cc;
  float t0 = 0.0;
  float t1 = -1.0;
  if (hh > 0.0) {
    hh = sqrt(hh);
    t0 = max(-bb - hh, 0.0);
    t1 = -bb + hh;
  }

  float dist = t0;
  float glow = 0.0;
  float hit = -1.0;
  float trap = 0.0;
  float steps = 0.0;
  if (t1 > 0.0) {
    int MARCH = marchSteps(28, 72);
    for (int i = 0; i < 72; i++) {
      if (i >= MARCH) break;
      vec3 p = ro + rd * dist;
      float tr;
      float d = bulbDE(p, power, iters, tr);
      glow += exp(-max(d, 0.0) * 26.0); // lit-from-within energy
      float eps = max(0.00035, dist * 0.8 / u_res.y); // pixel-footprint epsilon
      if (d < eps) {
        hit = dist;
        trap = tr;
        steps = float(i);
        break;
      }
      dist += d * 0.85;
      if (dist > t1) break;
    }
  }

  vec3 col = vec3(0.0);
  if (hit > 0.0) {
    vec3 p = ro + rd * hit;
    float nh = max(0.0012, hit * 1.5 / u_res.y); // far detail softens, no shimmer
    vec3 n = bulbNormal(p, power, iters, nh);
    vec3 lig = normalize(vec3(cos(ang + 1.1) * 0.8, 0.75, sin(ang + 1.1) * 0.8));

    float dif = clamp(dot(n, lig), 0.0, 1.0);
    float rim = pow(clamp(1.0 + dot(n, rd), 0.0, 1.0), 2.5);
    float ao = clamp(1.0 - steps / 46.0, 0.0, 1.0); // step-count occlusion
    ao = ao * ao * 0.78 + 0.22;

    float tr;
    float s1 = bulbDE(p + lig * 0.05, power, iters, tr);
    float s2 = bulbDE(p + lig * 0.16, power, iters, tr);
    float sha = clamp(min(s1 / 0.05, s2 / 0.16) * 1.6, 0.0, 1.0); // 2-tap soft shadow
    sha = 0.32 + 0.68 * sha;

    float ct = trap * 0.9 + 0.22 * length(p) + u_time * 0.02;
    vec3 base = pal(ct);
    vec3 rimc = pal(ct + 0.28);

    float depth = exp(-max(hit - t0, 0.0) * 0.35); // crevices sink into black
    col = base * (0.28 + 2.0 * dif * sha) * ao;
    col += rimc * rim * 1.1 * ao;
    col *= 0.55 + 0.6 * depth;
  }

  float aud = 1.0 + u_audio.x * 0.5;
  col += pal(0.12 + trap * 0.5 + u_time * 0.025) * glow * u_bglow * 0.03 * aud;

  col = col / (1.0 + col * 0.35); // soft rolloff: highlights hold, blacks stay black
  col += (hash21(v_uv * u_res + u_time) - 0.5) * 0.004; // dither out gradient banding
  fragColor = vec4(max(col, 0.0), 1.0);
}
