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

void main() {
  // ---- zoom schedule: 0 In, 1 Out, 2 Ping-Pong, 3 Hold ---------------------
  // The dive covers a fixed span and then loops. Running the depth off a bare
  // clock instead used to clamp at the precision limit, so after a minute or two
  // Zoom In and Zoom Out simply stopped moving and never started again.
  float base = clamp(u_basezoom, 0.0, ZLIMIT);
  // Cap the PEAK, not the span: the dive runs base..base+span, so capping only the
  // span let a high Start Depth push every cycle into the mush fade below.
  float span = clamp(CRISP - base, 0.0, 13.0);
  float phase = u_zspeedPhase * 0.25 / max(span, 0.001);
  float depth = base;
  if (u_zmode < 0.5) depth += span * diveCycle(phase);
  else if (u_zmode < 1.5) depth += span * (1.0 - diveCycle(phase));
  // Ping-Pong used a fixed frequency, so over a 13-octave span it travelled about
  // three times faster than Zoom In at the same Zoom Speed. Tying the frequency to
  // the span makes one slider mean one speed in every mode.
  else if (u_zmode < 2.5)
    depth += (span * 0.5) * (1.0 - cos(u_zspeedPhase * 0.25 * PI / max(span, 0.001)));
  depth = clamp(depth, 0.0, ZLIMIT);
  float scale = exp2(-depth);

  // ---- plane ---------------------------------------------------------------
  vec2 sp = rot2(u_spinPhase * 0.06) * (ctr(v_uv) * VIEW);
  vec2 pix = diveCenter(u_dive) + sp * scale;
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

  float halo = exp(-deN * 0.035); // wide falloff into black
  float fil = exp(-deN * 0.45);   // one-pixel filament riding the boundary
  float glow = 1.0 - exp(-acc * 0.05);
  float aud = 1.0 + u_audio.x * 0.35;

  vec3 col;
  if (escaped) {
    col = pal(t) * (0.035 + 0.85 * halo);
    col += pal(t + 0.22) * fil * 1.2 * aud;
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
