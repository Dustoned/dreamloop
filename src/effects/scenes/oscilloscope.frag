uniform float u_omode;     // 0 Line, 1 Ring, 2 Mirror
uniform float u_oamp;      // waveform amplitude
uniform float u_othick;    // line thickness
uniform float u_oglow;     // glow strength
uniform float u_olayers;   // ghost copies
uniform float u_ospin;     // scroll/rotation rate
uniform float u_ospinPhase; // integral of u_ospin: rate, not rescaled history

// The classic oscilloscope, neon edition: the line IS the sound. The engine
// uploads a 256-sample slice of the raw waveform every frame (u_waveform), so
// this draws the actual pressure wave coming out of the speakers — with palette
// colours, glow, and ghost layers trailing behind it.

/** Waveform sample mapped to -1..1, with a tiny idle breath so silence still lives. */
float wv(float t) {
  float w = (texture(u_waveform, vec2(clamp(fract(t), 0.004, 0.996), 0.5)).r - 0.5) * 2.0;
  w += 0.055 * sin(fract(t) * TAU * 2.0 + u_time * 1.6);
  return w;
}

/** Mirror-fold 0..1 so ring mode meets itself seamlessly at the seam. */
float mirrorT(float t) {
  return 1.0 - abs(1.0 - 2.0 * fract(t));
}

void main() {
  vec2 p = ctr(v_uv);
  float layers = clamp(floor(u_olayers + 0.5), 1.0, 5.0);
  float drift = u_time * 0.02;
  float aud = 1.0 + u_audio.x * 0.4;
  vec3 col = vec3(0.0);

  for (int i = 0; i < 5; i++) {
    if (float(i) >= layers) break;
    float off = float(i) * 0.04;
    float fade = 1.0 / (1.0 + float(i) * 0.9);
    float d;
    float huePos;

    if (u_omode < 0.5) {
      // Line: the wave scrolls across the screen
      float t = p.x * 0.35 + 0.5 + u_ospinPhase * 0.06 + off;
      float y = wv(t) * 0.34 * u_oamp;
      d = abs(p.y - y);
      huePos = t * 0.5;
    } else if (u_omode < 1.5) {
      // Ring: the wave wraps around a circle
      float ang = fract(atan(p.y, p.x) / TAU + 0.5 + u_ospinPhase * 0.05);
      float t = mirrorT(ang) + off;
      float rTarget = 0.3 + wv(t) * 0.15 * u_oamp;
      d = abs(length(p) - rTarget);
      huePos = ang;
    } else {
      // Mirror: the classic twin trace around the midline
      float t = p.x * 0.35 + 0.5 + u_ospinPhase * 0.06 + off;
      float y = abs(wv(t)) * 0.38 * u_oamp;
      d = abs(abs(p.y) - y);
      huePos = t * 0.5;
    }

    float core = 1.0 - smoothstep(0.0, 0.0045 * u_othick + 0.0015, d);
    float glow = exp(-d * (10.0 / max(u_oglow, 0.05)));
    vec3 c = pal(huePos + float(i) * 0.12 + drift);
    col += c * (core * 1.3 + glow * u_oglow * 0.55) * fade * aud;
  }

  col = col / (1.0 + col * 0.3);
  fragColor = vec4(max(col, 0.0), 1.0);
}
