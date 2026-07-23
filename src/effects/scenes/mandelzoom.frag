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

// Deep zoom into 2D escape-time fractals. Colour comes from the smooth iteration
// count and a two-channel orbit trap; brightness comes from the exterior distance
// estimate d = 0.5 * r * log(r) / |dz|, measured in PIXELS so the glowing filaments
// stay exactly one pixel wide at any zoom -> no shimmer, no aliasing crawl.

#define ZLIMIT 19.0    // fp32 dissolves past here; the mush fade below hides the rest
#define CRISP 15.0     // past here fp32 detail dissolves; keep every dive below it
#define VIEW 2.6       // world units across the short screen axis at depth 0
#define BAIL 1024.0    // |z|^2 escape radius, wide enough for a clean smooth count

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
vec2 diveCenter(float which) {
  if (which < 0.5) return vec2(-0.7453, 0.1127);     // Seahorse Valley
  if (which < 1.5) return vec2(0.2925, 0.0149);      // Elephant Valley
  if (which < 2.5) return vec2(-0.088, 0.654);       // Triple Spiral
  return vec2(-1.7687739, 0.0017890);                // Mini-brot
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

void main() {
  // ---- zoom schedule: 0 In, 1 Out, 2 Ping-Pong, 3 Hold, 4 Journey ----------
  // Zoom In / Out DIVE FOREVER: depth climbs at a real octaves-per-second rate and
  // wraps instantly once it is deep in the fp32 mush — where the picture has already
  // melted to a soft wash — instead of easing back out. So the camera only ever
  // moves inward: no rewind. The rate used to be u_zspeedPhase * 0.25 / span, which
  // at max Zoom Speed crawled at about a third of an octave per second; now max is a
  // brisk ~2.5 octaves per second.
  float base = clamp(u_basezoom, 0.0, CRISP - 1.0);   // start in the crisp zone
  float top = ZLIMIT - 0.8;                            // wrap deep in the mush (~18.2)
  float travel = u_zspeedPhase * 1.25;                 // octaves travelled so far
  bool journey = u_zmode >= 3.5;
  float depth;
  if (u_zmode < 1.5) depth = diveInfinite(travel, base, top, u_zmode);   // In / Out
  else if (u_zmode < 2.5)
    depth = base + (top - base) * (0.5 - 0.5 * cos(travel * PI / (top - base))); // Ping-Pong
  // Journey (mode 4): hold the zoom and travel the boundary instead — a fixed, safe
  // magnification, crawling the infinitely-detailed edge. Start Depth sets how close.
  else if (journey) depth = base + 4.6;
  else depth = base;                                                     // Hold
  depth = clamp(depth, 0.0, ZLIMIT);
  float scale = exp2(-depth);

  // ---- plane ---------------------------------------------------------------
  vec2 sp = rot2(u_spinPhase * 0.06) * (ctr(v_uv) * VIEW);
  // In Journey the wander radius tracks the view size (VIEW*scale), scaled up a bit
  // so the neighbourhood is explored without straying onto the smooth flats.
  vec2 centre = journey
    ? journeyCentre(diveCenter(u_dive), u_zspeedPhase * 3.0, VIEW * scale * 3.6)
    : diveCenter(u_dive);
  vec2 pix = centre + sp * scale;
  float px = VIEW * scale / u_res.y; // world units per screen pixel

  // Julia constant walks a Lissajous loop hugging the cardioid: shapes keep morphing.
  float ja = u_time * 0.06;
  vec2 jc = 0.7885 * vec2(cos(ja), sin(ja)) + 0.055 * vec2(sin(ja * 2.3), cos(ja * 1.7));
  float jm = clamp(u_juliamix, 0.0, 1.0);

  vec2 c = mix(pix, jc, jm);
  vec2 z = pix * jm;
  vec2 dz = vec2(jm, 0.0);   // d(z0)/d(pixel)
  float dc = 1.0 - jm;       // d(c)/d(pixel)

  // ---- formula select (uniform, so the branches below stay warp-coherent) ---
  float fShip = (u_formula >= 0.5 && u_formula < 1.5) ? 1.0 : 0.0;
  float fTri = (u_formula >= 1.5 && u_formula < 2.5) ? 1.0 : 0.0;
  float fCeltic = (u_formula >= 2.5 && u_formula < 3.5) ? 1.0 : 0.0;
  float fPhoenix = (u_formula >= 3.5) ? 1.0 : 0.0;

  float pw = clamp(u_power, 2.0, 8.0);
  float lpw = max(log2(pw), 0.5);
  bool sq = abs(pw - 2.0) < 1e-3; // classic squaring: skip the transcendentals

  int n = int(clamp(u_iters, 16.0, 400.0));
  vec2 zPrev = vec2(0.0);
  float trapR = 1e9;   // min |z|^2 over the orbit
  float trapL = 1e9;   // min |z.x|  -> distance to the line x = 0
  float acc = 0.0;     // energy: how long the orbit lingers near the origin
  float m = 0.0;
  float esc = -1.0;
  // Stripe Average Colouring (Jussi Härkönen): average sin(k*arg(z)) along the orbit.
  // It paints flame-like ripples across the wide smooth bands that plain escape-count
  // colouring leaves flat. stLast/stCount keep the last term so we can blend the final
  // partial average by the smooth-escape fraction and avoid banding at iteration steps.
  float stSum = 0.0, stCount = 0.0, stLast = 0.0;
  bool doStripe = u_stripes > 0.001;

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
    trapL = min(trapL, abs(z.x));
    acc += 1.0 / (1.0 + 22.0 * m);

    if (m > BAIL) {
      esc = float(i);
      break;
    }
  }

  bool escaped = esc >= 0.0;

  // ---- smooth iteration count + exterior distance estimate ------------------
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
