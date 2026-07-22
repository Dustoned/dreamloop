uniform float u_rbands;
uniform float u_rflow;
uniform float u_rflowPhase;   // integral of u_rflow: rate, not rescaled history
uniform float u_rwidth;
uniform float u_rswing;
uniform float u_rglow;
uniform float u_rdrive;

// Flowing ribbons of light, in the spirit of the old Media Player visualisers.
//
// Music-first: the shape IS the music. Each ribbon is a smooth travelling curve
// whose amplitude is one frequency band, so the low ribbons heave slowly with the
// bass while the high ones flutter on the hi-hats. Without a track playing they
// still drift, so the scene is never a dead screen.
//
// Deliberately calm compared with the fractal scenes — one readable gesture per
// band rather than a wall of detail.
void main() {
  vec2 p = ctr(v_uv);
  float amt = clamp(u_audioAmt, 0.0, 1.0);

  // Bands, low to high. mix() keeps a little life when the music is silent.
  float bass = mix(0.22, u_audio.x, amt);
  float mid = mix(0.18, u_audio.y, amt);
  float treb = mix(0.14, u_audio.z, amt);
  float beat = u_audio.w * amt;

  int n = int(clamp(u_rbands, 2.0, 9.0));
  float acc = 0.0;
  float hue = 0.0;

  for (int i = 0; i < 9; i++) {
    if (i >= n) break;
    float fi = float(i) / max(float(n) - 1.0, 1.0);   // 0 = lowest, 1 = highest

    // Which part of the spectrum drives this ribbon.
    float band = fi < 0.5 ? mix(bass, mid, fi * 2.0) : mix(mid, treb, fi * 2.0 - 1.0);
    // Higher ribbons ripple faster and finer.
    float freq = mix(1.4, 5.5, fi);
    float speed = mix(0.55, 1.7, fi);

    float t = u_rflowPhase * speed;
    // Two summed waves plus a slow noise wander, so it never repeats visibly.
    float y = sin(p.x * freq + t) * 0.5
            + sin(p.x * freq * 1.87 - t * 0.73) * 0.28
            + (vnoise(vec2(p.x * 0.7 + t * 0.11, fi * 5.0)) - 0.5) * 0.7;

    // Amplitude is the band. u_rdrive decides how much the music owns the shape.
    float amp = (0.045 + 0.42 * band * u_rdrive) * u_rswing;
    float centre = (fi - 0.5) * 0.62;
    float dist = abs(p.y - centre - y * amp);

    // Thin core, wide halo: the halo is what makes it glow rather than draw.
    float w = mix(0.055, 0.014, fi) * u_rwidth * (1.0 + beat * 0.5);
    float core = w / (dist + w);
    acc += core * core * (0.35 + band * 1.5);
    hue += core * (fi * 0.55 + band * 0.35);
  }

  float t = hue / max(acc, 0.001) + u_time * 0.03 + p.x * 0.06;
  vec3 col = pal(t) * acc * (0.5 + u_rglow * 1.6);

  // A beat lifts the whole field briefly rather than jolting it.
  col *= 1.0 + beat * 0.45;
  // Bass fills the background with a wash, so silence is dark and loud is alive.
  col += pal(t + 0.4) * bass * bass * 0.06;

  col = col / (1.0 + col * 0.4);
  fragColor = vec4(max(col, 0.0), 1.0);
}
