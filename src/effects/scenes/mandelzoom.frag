uniform float u_formula;
uniform float u_power;
uniform float u_juliamix;
uniform float u_dive;
uniform float u_zmode;
uniform float u_zspeed;
uniform float u_zspeedPhase;   // integral of u_zspeed: rate, not rescaled history
uniform float u_basezoom;
uniform float u_iters;
uniform float u_trapmix;
uniform float u_spin;
uniform float u_spinPhase;   // integral: rate, not rescaled history
uniform float u_stripes;     // stripe average colouring: detail in the smooth exterior
uniform float u_relief;      // fake-3D relief lit by the complex derivative
uniform float u_trapshape;   // orbit-trap shape: line / cross / circle / diamond
uniform float u_engine;      // 0 Classic (fp32 loop), 1 Infinite (perturbation)
uniform sampler2D u_ref;     // reference orbit for ∞ layer A (Zx, Zy per iteration)
uniform float u_refLen;      // valid samples in layer A's reference
uniform sampler2D u_refB;    // reference orbit for ∞ layer B
uniform float u_refLenB;     // valid samples in layer B's reference
uniform float u_pdepthA;     // ∞ layer A depth (CPU-driven, constant-speed dive)
uniform float u_pdepthB;     // ∞ layer B depth (offset half a cycle)
uniform float u_wA;          // ∞ cross-fade weight for layer A (1-wA for B)

// Deep zoom into 2D escape-time fractals. Colour comes from the smooth iteration
// count and a two-channel orbit trap; brightness comes from the exterior distance
// estimate d = 0.5 * r * log(r) / |dz|, measured in PIXELS so the glowing filaments
// stay exactly one pixel wide at any zoom -> no shimmer, no aliasing crawl.

#define ZLIMIT 19.0    // fp32 dissolves past here; the mush fade below hides the rest
#define CRISP 15.0     // past here fp32 detail dissolves; keep every dive below it
#define VIEW 2.6       // world units across the short screen axis at depth 0
#define BAIL 1024.0    // |z|^2 escape radius, wide enough for a clean smooth count
#define PMAX 46.0      // perturbation depth ceiling (fp64 centre precision limit)

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
  float d = dot(b, b);
  if (d < 1e-30) return vec2(0.0);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d;
}

/** z^p via polar form; p may be fractional. */
vec2 cpow(vec2 z, float p) {
  float r2 = dot(z, z);
  if (r2 < 1e-30) return vec2(0.0);
  float rp = exp(0.5 * p * log(r2));
  float a = p * atan(z.y, z.x);
  return rp * vec2(cos(a), sin(a));
}

/** Famous dive targets. */
// These MUST match Engine.REF_CENTERS exactly, so the Classic (fp32) path and the
// Infinite (perturbation) path centre on the identical point and hand off seamlessly.
vec2 diveCenter(float which) {
  if (which < 0.5) return vec2(-0.7436438870371587, 0.13182590420531197); // Seahorse Valley
  if (which < 1.5) return vec2(0.2925755, 0.0149977);                     // Elephant Valley
  if (which < 2.5) return vec2(-0.088, 0.654);                            // Triple Spiral
  return vec2(-1.7687739, 0.001789);                                      // Mini-brot
}

/**
 * Endless wandering around whichever dive target the user picked. The famous
 * targets all sit in uniformly dense boundary territory — seahorse tails, elephant
 * trunks, spiral arms — so a slow drift AROUND one, at a held magnification, always
 * shows rich filigree and never runs out of new scenery. The drift is a sum of two
 * incommensurate noise loops, so it never exactly repeats, and it stays within a
 * small radius of the target, so it never wanders out into the smooth flats and
 * never leaves the fp32-safe coordinate range.
 *
 * `rad` is the wander radius in world units; keep it comparable to the view size
 * so you explore the neighbourhood without straying off the interesting patch.
 */
vec2 journeyCentre(vec2 target, float t, float rad) {
  vec2 w = vec2(
    vnoise(vec2(t * 0.11, 1.7)) - 0.5 + 0.5 * (vnoise(vec2(t * 0.037, 9.3)) - 0.5),
    vnoise(vec2(t * 0.11, 8.2)) - 0.5 + 0.5 * (vnoise(vec2(t * 0.037, 4.1)) - 0.5)
  );
  return target + w * rad;
}

// One perturbation layer of the ∞ engine: a crisp Mandelbrot at the given depth,
// using the given reference orbit (its centre is implicit in the reference — the
// pixel only ever works with the tiny offset δc, so no absolute centre is needed).
// Two of these, at different depths and centres, cross-fade into an endless zoom.
vec3 perturbLayer(float depth, sampler2D refTex, float refLen) {
  float scale = exp2(-depth);
  vec2 sp = rot2(u_spinPhase * 0.06) * (ctr(v_uv) * VIEW);
  float px = VIEW * scale / u_res.y;
  vec2 dc0 = sp * scale;    // δc
  vec2 dlt = vec2(0.0);
  vec2 z = vec2(0.0), dz = vec2(0.0);
  float trapR = 1e9, trapL = 1e9, acc = 0.0, m = 0.0, esc = -1.0;
  float stSum = 0.0, stCount = 0.0, stLast = 0.0;
  bool doStripe = u_stripes > 0.001;
  float maxIter = min(refLen - 1.0, u_iters * 10.0);
  int budget = int(maxIter);
  for (int i = 0; i < 4096; i++) {
    if (i >= budget) break;
    vec2 Zi = texelFetch(refTex, ivec2(i, 0), 0).xy;
    vec2 zi = Zi + dlt;
    dz = 2.0 * cmul(zi, dz) + vec2(1.0, 0.0);
    dlt = 2.0 * cmul(Zi, dlt) + cmul(dlt, dlt) + dc0;
    z = texelFetch(refTex, ivec2(i + 1, 0), 0).xy + dlt;
    if (doStripe) { stLast = 0.5 + 0.5 * sin(6.0 * atan(z.y, z.x)); stSum += stLast; stCount += 1.0; }
    m = dot(z, z);
    trapR = min(trapR, m);
    float td;
    if (u_trapshape < 0.5) td = abs(z.x);
    else if (u_trapshape < 1.5) td = min(abs(z.x), abs(z.y));
    else if (u_trapshape < 2.5) td = abs(length(z) - 1.0);
    else td = abs(abs(z.x) - abs(z.y)) * 0.70711;
    trapL = min(trapL, td);
    acc += 1.0 / (1.0 + 22.0 * m);
    if (m > BAIL) { esc = float(i); break; }
  }
  bool escaped = esc >= 0.0;
  float sn = maxIter;
  float deN = 1e6;
  if (escaped) {
    float lz = 0.5 * log2(max(m, 1.0001));
    sn = esc - log2(max(lz, 1e-6)); // lpw = 1 for Mandelbrot
    float dl2 = dot(dz, dz), dd;
    if (dl2 > 1e-30 && dl2 < 1e30) dd = 0.5 * sqrt(m) * log(m) / sqrt(dl2);
    else if (dl2 >= 1e30) dd = 0.0;
    else dd = 1e6 * px;
    deN = dd / max(px, 1e-30);
  }
  float tr = sqrt(min(trapR, 4.0)), tl = min(trapL, 2.0);
  float tIter = sn * 0.021;
  float tTrap = 0.85 * pow(clamp(tr * 0.55, 0.0, 1.0), 0.45)
              + 0.45 * pow(clamp(tl * 1.6, 0.0, 1.0), 0.55);
  float dither = (hash21(gl_FragCoord.xy) - 0.5) / 512.0;
  float drift = u_time * 0.02 + dither;
  float t = mix(tIter, tTrap, clamp(u_trapmix, 0.0, 1.0)) + drift;
  float ts = t;
  if (escaped && doStripe && stCount > 1.5) {
    float a1 = stSum / stCount, a2 = (stSum - stLast) / (stCount - 1.0);
    ts = t + u_stripes * (mix(a2, a1, fract(sn)) - 0.5) * 0.9;
  }
  float relief = 1.0;
  if (escaped && u_relief > 0.001) {
    vec2 un = normalize(cdiv(z, dz));
    float lang = 2.3 + u_time * 0.05;
    float refl = clamp((dot(un, vec2(cos(lang), sin(lang))) + 1.5) / 2.5, 0.0, 1.0);
    relief = mix(1.0, 0.30 + 1.45 * refl, u_relief);
  }
  float halo = exp(-deN * 0.035), fil = exp(-deN * 0.45), glow = 1.0 - exp(-acc * 0.05);
  float aud = 1.0 + u_audio.x * 0.35;
  vec3 col;
  if (escaped) {
    col = pal(ts) * (0.035 + 0.85 * halo);
    col += pal(ts + 0.22) * fil * 1.2 * aud;
    col *= relief;
  } else {
    float structure = exp(-tr * 2.4) + 0.55 * exp(-tl * 7.0);
    col = pal(mix(t, tTrap * 0.9 + drift, 0.65)) * (0.015 + 0.24 * structure);
  }
  col += pal(0.12 + t * 0.2 + u_time * 0.02) * glow * 0.16 * aud;
  return col / (1.0 + col * 0.32);
}

void main() {
  // ---- Infinite engine: two continuously-diving perturbation layers cross-fade
  // into each other, so the zoom runs at a CONSTANT speed forever — no reset, no
  // black fade, no jump. This is the classic seamless-infinite-zoom construction:
  // as one layer nears its precision floor it fades out while the other (offset half
  // a cycle, on a different centre) is at full strength, and vice versa.
  bool inf = u_engine > 0.5;
  bool infDive = inf && u_zmode < 0.5;
  if (infDive) {
    vec3 cA = perturbLayer(u_pdepthA, u_ref, u_refLen);
    vec3 cB = perturbLayer(u_pdepthB, u_refB, u_refLenB);
    fragColor = vec4(max(mix(cB, cA, clamp(u_wA, 0.0, 1.0)), 0.0), 1.0);
    return;
  }

  // ---- Classic engine: the fp32 looping dive (all formulas) -----------------
  float base = clamp(u_basezoom, 0.0, CRISP - 1.0);
  float top = ZLIMIT - 0.8;
  float travel = u_zspeedPhase * 1.25;
  float depth;
  if (u_zmode < 1.5) depth = diveInfinite(travel, base, top, u_zmode);
  else if (u_zmode < 2.5)
    depth = base + (top - base) * (0.5 - 0.5 * cos(travel * PI / (top - base)));
  else if (u_zmode >= 3.5) depth = base + 4.6;   // Journey
  else depth = base;                             // Hold
  depth = clamp(depth, 0.0, ZLIMIT);
  float scale = exp2(-depth);
  bool journey = u_zmode >= 3.5;

  vec2 dcen = diveCenter(u_dive);
  vec2 sp = rot2(u_spinPhase * 0.06) * (ctr(v_uv) * VIEW);
  vec2 centre = journey
    ? journeyCentre(dcen, u_zspeedPhase * 3.0, VIEW * scale * 3.6)
    : dcen;
  vec2 pix = centre + sp * scale;
  float px = VIEW * scale / u_res.y;

  float trapR = 1e9, trapL = 1e9, acc = 0.0, m = 0.0, esc = -1.0;
  float stSum = 0.0, stCount = 0.0, stLast = 0.0;
  bool doStripe = u_stripes > 0.001;
  float ja = u_time * 0.06;
  vec2 jc = 0.7885 * vec2(cos(ja), sin(ja)) + 0.055 * vec2(sin(ja * 2.3), cos(ja * 1.7));
  float jm = clamp(u_juliamix, 0.0, 1.0);
  vec2 c = mix(pix, jc, jm);
  vec2 z = pix * jm;
  vec2 dz = vec2(jm, 0.0);
  float dc = 1.0 - jm;
  float fShip = (u_formula >= 0.5 && u_formula < 1.5) ? 1.0 : 0.0;
  float fTri = (u_formula >= 1.5 && u_formula < 2.5) ? 1.0 : 0.0;
  float fCeltic = (u_formula >= 2.5 && u_formula < 3.5) ? 1.0 : 0.0;
  float fPhoenix = (u_formula >= 3.5) ? 1.0 : 0.0;
  float pw = clamp(u_power, 2.0, 8.0);
  float lpw = max(log2(pw), 0.5);
  bool sq = abs(pw - 2.0) < 1e-3; // classic squaring: skip the transcendentals
  int n = int(clamp(u_iters, 16.0, 400.0));
  float maxIter = float(n);
  vec2 zPrev = vec2(0.0);

  for (int i = 0; i < 400; i++) {
    if (i >= n) break;

    vec2 zi = mix(z, abs(z), fShip);      // Burning Ship
    zi.y = mix(zi.y, -zi.y, fTri);        // Tricorn

    vec2 zp;
    vec2 dzm; // zi^(pw-1)
    if (sq) {
      zp = vec2(zi.x * zi.x - zi.y * zi.y, 2.0 * zi.x * zi.y);
      dzm = zi;
    } else {
      zp = cpow(zi, pw);
      dzm = cdiv(zp, zi);
    }

    // running derivative -> distance estimate (approximate for the folded variants)
    dz = pw * cmul(dzm, dz) + vec2(dc, 0.0);

    zp.x = mix(zp.x, abs(zp.x), fCeltic); // Celtic
    vec2 zn = zp + c - 0.5 * fPhoenix * zPrev; // Phoenix: + p * zPrev, p = -0.5
    zPrev = z;
    z = zn;

    if (doStripe && i >= 1) {
      stLast = 0.5 + 0.5 * sin(6.0 * atan(z.y, z.x));
      stSum += stLast;
      stCount += 1.0;
    }

    m = dot(z, z);
    trapR = min(trapR, m);
    // Orbit-trap shape: the second trap that paints the neon filaments. Different
    // shapes catch the orbit in a line, cross, circle or diamond -> different colour
    // textures over the same fractal. Shape 0 is the original vertical line.
    float td;
    if (u_trapshape < 0.5) td = abs(z.x);
    else if (u_trapshape < 1.5) td = min(abs(z.x), abs(z.y));
    else if (u_trapshape < 2.5) td = abs(length(z) - 1.0);
    else td = abs(abs(z.x) - abs(z.y)) * 0.70711;
    trapL = min(trapL, td);
    acc += 1.0 / (1.0 + 22.0 * m);

    if (m > BAIL) {
      esc = float(i);
      break;
    }
  }

  bool escaped = esc >= 0.0;

  // ---- smooth iteration count + exterior distance estimate ------------------
  float sn = maxIter;
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

  // ---- colour ---------------------------------------------------------------
  float tr = sqrt(min(trapR, 4.0));
  float tl = min(trapL, 2.0);
  float tIter = sn * 0.021;
  float tTrap = 0.85 * pow(clamp(tr * 0.55, 0.0, 1.0), 0.45)
              + 0.45 * pow(clamp(tl * 1.6, 0.0, 1.0), 0.55);
  float dither = (hash21(gl_FragCoord.xy) - 0.5) / 512.0;
  float drift = u_time * 0.02 + dither;
  float t = mix(tIter, tTrap, clamp(u_trapmix, 0.0, 1.0)) + drift;

  // Stripe average, blended by the smooth-escape fraction so it never bands, then
  // fed into the exterior palette coordinate as extra ripple detail.
  float ts = t;
  if (escaped && doStripe && stCount > 1.5) {
    float avg1 = stSum / stCount;
    float avg2 = (stSum - stLast) / (stCount - 1.0);
    float stripeVal = mix(avg2, avg1, fract(sn));
    ts = t + u_stripes * (stripeVal - 0.5) * 0.9;
  }

  // Relief: light the boundary by the complex-derivative "normal" u = z / z'. Slopes
  // facing the (slowly turning) light brighten, the rest fall into shadow -> embossed 3D.
  float relief = 1.0;
  if (escaped && u_relief > 0.001) {
    vec2 un = normalize(cdiv(z, dz));
    float lang = 2.3 + u_time * 0.05;
    float refl = clamp((dot(un, vec2(cos(lang), sin(lang))) + 1.5) / 2.5, 0.0, 1.0);
    relief = mix(1.0, 0.30 + 1.45 * refl, u_relief);
  }

  float halo = exp(-deN * 0.035); // wide falloff into black
  float fil = exp(-deN * 0.45);   // one-pixel filament riding the boundary
  float glow = 1.0 - exp(-acc * 0.05);
  float aud = 1.0 + u_audio.x * 0.35;

  vec3 col;
  if (escaped) {
    col = pal(ts) * (0.035 + 0.85 * halo);
    col += pal(ts + 0.22) * fil * 1.2 * aud;
    col *= relief;
  } else {
    // interior: near black, but the trap keeps the inner filigree readable
    float structure = exp(-tr * 2.4) + 0.55 * exp(-tl * 7.0);
    vec3 base = pal(mix(t, tTrap * 0.9 + drift, 0.65));
    col = base * (0.015 + 0.24 * structure);
  }
  col += pal(0.12 + t * 0.2 + u_time * 0.02) * glow * 0.16 * aud;

  // ---- fp32 breakup: melt into a low-frequency version instead of hash noise -
  float mush = smoothstep(CRISP, ZLIMIT, depth);
  vec3 low = pal(t * 0.3 + 0.12 + u_time * 0.02)
           * (0.05 + 0.62 * sqrt(clamp(luma(col) * 1.5, 0.0, 1.0)));
  col = mix(col, low, mush * 0.85);

  col = col / (1.0 + col * 0.32); // soft rolloff: highlights hold, blacks stay black
  fragColor = vec4(max(col, 0.0), 1.0);
}
