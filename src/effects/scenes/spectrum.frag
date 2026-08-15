uniform float u_smode;     // 0 Ring, 1 Wave, 2 Tunnel
uniform float u_smirror;   // mirror copies around the circle
uniform float u_sbase;     // base ring radius
uniform float u_sheight;   // bar length
uniform float u_srot;      // rotation rate
uniform float u_srotPhase; // integral of u_srot: rate, not rescaled history
uniform float u_ssharp;    // bar sharpness
uniform float u_sglow;     // glow strength

// A real spectrum analyzer, psychedelic edition: the bars ARE the music. The
// engine uploads the analyser's 128-bin log-spaced spectrum as u_spectrum, so
// every wiggle on screen is an actual frequency in the track — the classic
// media-player visualizer, reborn with palettes, glow and kaleidoscopic mirrors.

/** Spectrum lookup with gamma and an idle breathing floor, so silence never
 *  renders a dead flat ring — it hums along quietly until the music returns. */
float spec(float t) {
  t = clamp(t, 0.004, 0.996);
  float s = texture(u_spectrum, vec2(t, 0.5)).r;
  s = pow(s, 1.35);
  float idle = 0.06 + 0.05 * sin(t * 19.0 + u_time * 1.1) + 0.03 * sin(t * 43.0 - u_time * 0.6);
  return max(s, idle);
}

/** Fold an angle 0..1 into m mirrored copies, seam-free (triangle fold). */
float foldT(float a, float m) {
  float x = fract(a) * m;
  float seg = fract(x);
  return mix(seg, 1.0 - seg, step(1.0, mod(floor(x), 2.0)));
}

void main() {
  vec2 p = rot2(u_srotPhase * 0.35) * ctr(v_uv);
  float m = max(1.0, floor(u_smirror + 0.5));
  float drift = u_time * 0.02;
  float aud = 1.0 + u_audio.x * 0.5;
  vec3 col = vec3(0.0);

  if (u_smode < 0.5) {
    // ---- Ring: bars radiate outward from a breathing circle -----------------
    float r = length(p);
    float ang = atan(p.y, p.x) / TAU + 0.5;
    float t = foldT(ang, m);
    float h = spec(t) * u_sheight * 0.38;
    float base = u_sbase * (1.0 + u_audio.x * 0.06);
    float tip = base + h;
    // inside the bar: bright; outside: glow falling off from the tip
    float inBar = smoothstep(base - 0.012, base, r) * (1.0 - smoothstep(tip, tip + 0.012 / u_ssharp, r));
    float glowOut = exp(-max(r - tip, 0.0) * (16.0 / max(u_sglow, 0.05)));
    float glowIn = exp(-max(base - r, 0.0) * 22.0) * 0.6;
    vec3 barCol = pal(t * 0.6 + h * 0.5 + drift);
    col += barCol * inBar * (0.55 + h * 2.2) * aud;
    col += barCol * (glowOut + glowIn) * u_sglow * 0.55 * aud;
    // thin core ring so the circle reads even in silence
    col += pal(drift + 0.45) * exp(-abs(r - base) * 90.0) * 0.8;
  } else if (u_smode < 1.5) {
    // ---- Wave: mirrored bars around the horizontal midline ------------------
    float t = foldT(p.x * 0.35 + 0.5, m);
    float h = spec(t) * u_sheight * 0.42;
    float d = abs(p.y);
    float inBar = 1.0 - smoothstep(h, h + 0.015 / u_ssharp, d);
    float glow = exp(-max(d - h, 0.0) * (14.0 / max(u_sglow, 0.05)));
    vec3 barCol = pal(t * 0.7 + h * 0.4 + drift);
    col += barCol * inBar * (0.5 + h * 2.0) * aud;
    col += barCol * glow * u_sglow * 0.5 * aud;
    // centre line
    col += pal(drift + 0.45) * exp(-d * 80.0) * 0.7;
  } else {
    // ---- Tunnel: rings of spectrum receding into depth ----------------------
    float r = max(length(p), 1e-4);
    float ang = atan(p.y, p.x) / TAU + 0.5;
    float t = foldT(ang + u_srotPhase * 0.03, m);
    float h = spec(t);
    // log-polar depth rings; each ring's radius wobbles with the spectrum
    float depth = fract(-log(r) * 0.9 + u_time * 0.12);
    float ringD = abs(depth - 0.5 - h * u_sheight * 0.28);
    float ring = exp(-ringD * (26.0 * u_ssharp));
    vec3 c1 = pal(t * 0.6 + depth * 0.3 + drift);
    col += c1 * ring * (0.4 + h * 1.8) * aud * (0.35 + 0.65 * r);
    col += c1 * exp(-ringD * 6.0) * u_sglow * 0.35 * aud * r;
  }

  col = col / (1.0 + col * 0.3);
  fragColor = vec4(max(col, 0.0), 1.0);
}
