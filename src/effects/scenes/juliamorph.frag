uniform float u_jpath;
uniform float u_jmorph;
uniform float u_jpower;
uniform float u_zmode;
uniform float u_zspeed;
uniform float u_basezoom;
uniform float u_jiters;
uniform float u_jglow;
uniform float u_jspin;

// Continuously shape-shifting Julia set. The constant c never stops travelling a
// path that hugs the boundary of the parameter set, so the filigree keeps folding
// into new shapes. Colour blends the smooth iteration count with two orbit traps:
// min |z| (glowing cores) and the min distance to a slowly rotating line through
// the origin (neon tendrils). Brightness rides the exterior distance estimate
// d = 0.5 * r * log(r) / |dz| measured in PIXELS, so the filaments stay one pixel
// wide at any zoom -> no shimmer, no aliasing crawl in the far field.

#define ZLIMIT 19.0   // fp32 dissolves past here; the mush fade below hides the rest
#define CRISP 15.0     // past here fp32 detail dissolves; keep every dive below it
#define VIEW 3.0      // world units across the short screen axis at depth 0
#define BAIL 1024.0   // |z|^2 escape radius, wide enough for a clean smooth count

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
  float d = dot(b, b);
  if (d < 1e-30) return vec2(0.0);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d;
}

vec2 csqrt(vec2 z) {
  float m = length(z);
  if (m < 1e-24) return vec2(0.0);
  float a = 0.5 * atan(z.y, z.x);
  return sqrt(m) * vec2(cos(a), sin(a));
}

/** z^p via polar form; p may be fractional. */
vec2 cpow(vec2 z, float p) {
  float r2 = dot(z, z);
  if (r2 < 1e-30) return vec2(0.0);
  float rp = exp(0.5 * p * log(r2));
  float a = p * atan(z.y, z.x);
  return rp * vec2(cos(a), sin(a));
}

/** Point at internal angle th, internal radius rho, inside the main cardioid. */
vec2 cardioidPt(float rho, float th) {
  vec2 mu = rho * vec2(cos(th), sin(th));
  return 0.5 * mu - 0.25 * cmul(mu, mu);
}

/** The journey of the julia constant. Every path grazes the boundary of the
 *  parameter set (|c| ~ 0.25 at the cusp up to ~0.8), so the set is always rich
 *  filigree - never a fat featureless blob, never thin empty dust. */
vec2 juliaPath(float a) {
  if (u_jpath < 0.5) {
    // Circle inscribed in the main cardioid: grazes the cusp and the period-2 root,
    // hugging the boundary all the way round the left flank.
    return vec2(-0.25, 0.0) + 0.49 * vec2(cos(a), sin(a));
  }
  if (u_jpath < 1.5) {
    // Cardioid edge, pulled a hair inward so the set stays connected; the sin term
    // hurries the walk through the slow parabolic cusp.
    float th = a + 0.55 * sin(a);
    float r = 0.5 * (1.0 - cos(th)) * (0.982 - 0.012 * sin(a * 3.0));
    return vec2(0.25, 0.0) + r * vec2(cos(th), sin(th));
  }
  if (u_jpath < 2.5) {
    // Figure eight woven along the boundary near the basilica: the angle sweeps
    // back and forth while the radius bobs in and out of the edge.
    float x = cos(a);
    float y = sin(a) * cos(a);
    return cardioidPt(0.97 + 0.055 * y, PI + 1.45 * x);
  }
  // Random walk: smooth value-noise drift, still pinned to the boundary.
  float th = TAU * (1.5 * vnoise(vec2(a * 0.11, 3.7)) - 0.35) + a * 0.06;
  float rho = 0.90 + 0.095 * vnoise(vec2(a * 0.09, 11.3));
  return cardioidPt(rho, th);
}

void main() {
  // ---- power ----------------------------------------------------------------
  float pw = clamp(u_jpower, 2.0, 8.0);
  float lpw = max(log2(pw), 0.5);
  bool sq = abs(pw - 2.0) < 1e-3; // classic squaring: skip the transcendentals

  // ---- zoom schedule: 0 In, 1 Out, 2 Ping-Pong, 3 Hold ----------------------
  float base = clamp(u_basezoom, -2.0, ZLIMIT);
  float span = clamp(CRISP - base, 0.0, 12.0);   // stay below the fp32 mush zone
  // Looping dive, so Zoom In / Zoom Out keep moving instead of clamping to a
  // standstill after the first minute.
  float phase = u_time * u_zspeed * 0.25 / max(span, 0.001);
  float depth = base;
  if (u_zmode < 0.5) depth += span * diveCycle(phase);
  else if (u_zmode < 1.5) depth += span * (1.0 - diveCycle(phase));
  // Frequency scaled by the span, so Zoom Speed means the same rate in every mode.
  else if (u_zmode < 2.5)
    depth += (span * 0.5) * (1.0 - cos(u_time * u_zspeed * 0.25 * PI / max(span, 0.001)));
  depth = clamp(depth, -2.0, ZLIMIT);
  float scale = exp2(-depth);

  // ---- the morphing constant ------------------------------------------------
  // A magnified view needs a far slower morph or the structure tears across the
  // screen faster than the eye can follow: shape holds still while we dive, and
  // keeps travelling whenever we are wide.
  float morph = u_jmorph * 0.25 * exp2(-max(depth, 0.0) * 0.85);
  vec2 c = juliaPath(1.9 + u_time * morph);
  // Higher powers push their interesting parameter band slightly outward.
  float zr = pow(1.0 / pw, 1.0 / (pw - 1.0));
  c *= (zr * (1.0 + 1.0 / pw)) / 0.75;

  // ---- zoom target ----------------------------------------------------------
  // The repelling fixed point always lies ON the julia set and the set is
  // asymptotically self-similar around it, so diving at it never bottoms out in
  // flat interior. Seed with the quadratic root, then Newton it onto z^p + c = z.
  vec2 beta = 0.5 * (vec2(1.0, 0.0) + csqrt(vec2(1.0, 0.0) - 4.0 * c));
  for (int k = 0; k < 4; k++) {
    vec2 bp = cpow(beta, pw);
    vec2 bm1 = cdiv(bp, beta);
    beta -= cdiv(bp + c - beta, pw * bm1 - vec2(1.0, 0.0));
  }
  if (!(dot(beta, beta) < 4.0)) beta = vec2(0.0); // runaway / NaN guard
  vec2 center = mix(vec2(0.0), beta, smoothstep(0.3, 3.0, depth));

  // ---- plane ----------------------------------------------------------------
  vec2 sp = rot2(u_jspin * u_time * 0.06 + 0.06 * sin(u_time * 0.05)) * (ctr(v_uv) * VIEW);
  vec2 z = center + sp * scale;
  float px = VIEW * scale / u_res.y; // world units per screen pixel

  // Line trap through the origin, turning slowly: filaments sweep as it rotates.
  float lang = u_time * (0.11 + 0.4 * u_jspin);
  vec2 lnrm = vec2(-sin(lang), cos(lang));

  // ---- iterate --------------------------------------------------------------
  int n = int(clamp(u_jiters, 32.0, 300.0));
  vec2 dz = vec2(1.0, 0.0); // d(z_i)/d(z_0)
  float trapR = 1e9;        // min |z|^2 over the orbit -> cores
  float trapL = 1e9;        // min distance to the rotating line -> filaments
  float acc = 0.0;          // energy: how long the orbit lingers near the origin
  float m = 0.0;
  float esc = -1.0;

  for (int i = 0; i < 300; i++) {
    if (i >= n) break;

    vec2 zp;
    vec2 zm1; // z^(p-1), for the running derivative
    if (sq) {
      zp = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
      zm1 = z;
    } else {
      zp = cpow(z, pw);
      zm1 = cdiv(zp, z);
    }
    dz = pw * cmul(zm1, dz);
    z = zp + c;

    m = dot(z, z);
    trapR = min(trapR, m);
    trapL = min(trapL, abs(dot(z, lnrm)));
    acc += 1.0 / (1.0 + 26.0 * m);

    if (m > BAIL) {
      esc = float(i);
      break;
    }
  }

  bool escaped = esc >= 0.0;

  // ---- smooth iteration count + exterior distance estimate -------------------
  float sn = float(n);
  float deN = 1e6; // distance to the set, in pixels
  if (escaped) {
    float lz = 0.5 * log2(max(m, 1.0001));
    sn = esc - log2(max(lz, 1e-6)) / lpw;

    float dl2 = dot(dz, dz);
    float dd;
    if (dl2 > 1e-30 && dl2 < 1e30) dd = 0.5 * sqrt(m) * log(m) / sqrt(dl2);
    else if (dl2 >= 1e30) dd = 0.0; // derivative blew up: we are on the boundary
    else dd = 1e6 * px;             // vanished (or NaN): treat as far away
    deN = dd / max(px, 1e-30);
  }

  // ---- colour ----------------------------------------------------------------
  float tr = sqrt(min(trapR, 4.0)); // min |z|
  float tl = min(trapL, 2.0);       // line trap
  float dither = (hash21(gl_FragCoord.xy) - 0.5) / 512.0;
  float drift = u_time * 0.02 + dither;
  float tIter = sqrt(max(sn, 0.0)) * 0.085;
  float tTrap = 0.70 * pow(clamp(tr * 0.55, 0.0, 1.0), 0.45)
              + 0.42 * pow(clamp(tl * 1.5, 0.0, 1.0), 0.60);
  float t = 0.55 * tIter + 0.45 * tTrap + drift;

  float halo = exp(-deN * 0.03);  // wide falloff into black
  float fil = exp(-deN * 0.45);   // one-pixel filament riding the boundary
  float glow = 1.0 - exp(-acc * 0.05);
  float fila = exp(-tl * 17.0);   // neon tendril from the line trap
  float core = exp(-tr * 4.2);    // burning core from the |z| trap
  float gk = clamp(u_jglow, 0.0, 1.0);
  float aud = 1.0 + u_audio.x * 0.4 + u_audio.w * 0.2;

  vec3 col;
  if (escaped) {
    float near = 0.15 + 0.85 * halo; // keep the empty far field genuinely black
    col = pal(t) * (0.03 + 0.8 * halo);
    col += pal(t + 0.20) * fil * 1.15 * aud;
    col += pal(t + 0.44) * fila * gk * 1.30 * near * aud;
    col += pal(t + 0.70) * core * gk * 0.70 * near * aud;
    col += pal(0.1 + t * 0.25 + drift) * glow * 0.13 * aud;
  } else {
    // interior: deep black with a faint trap-coloured sheen
    float structure = exp(-tr * 2.6) + 0.6 * exp(-tl * 8.0);
    col = pal(mix(t, tTrap * 0.9 + drift, 0.6)) * (0.012 + 0.20 * structure * (0.35 + 0.65 * gk));
  }

  // ---- fp32 breakup: melt into a low-frequency version instead of hash noise --
  float mush = smoothstep(CRISP, ZLIMIT, depth);
  vec3 low = pal(t * 0.3 + 0.1 + drift)
           * (0.05 + 0.6 * sqrt(clamp(luma(col) * 1.5, 0.0, 1.0)));
  col = mix(col, low, mush * 0.85);

  col = col / (1.0 + col * 0.3); // soft rolloff: highlights hold, blacks stay black
  fragColor = vec4(max(col, 0.0), 1.0);
}
