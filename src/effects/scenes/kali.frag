uniform float u_iter;
uniform float u_shapex;
uniform float u_shapey;
uniform float u_kzoom;
uniform float u_journey;
uniform float u_journeyPhase;   // integral of u_journey: rate, not rescaled history
uniform float u_kmode;
uniform float u_kformula;
uniform float u_kspin;
uniform float u_kspinPhase;   // integral of u_kspin: rate, not rescaled history
uniform float u_kglow;
uniform float u_kdrift;

// Kali-style IFS. The fold variant (u_kformula) changes the creature completely;
// u_kmode chooses between drifting, endlessly zooming, or holding still.
void main() {
  // Zoom: In / Out / Ping-Pong / Hold, over a 2.5-octave range (~6x). The old
  // version wrapped a single octave with fract() on the assumption that the fold
  // is self-similar at 2x — it is not, so every lap ended in a visible jump.
  //
  // The rate used to be 0.024, which at the default Zoom Speed is one lap every
  // 119 seconds - 0.021 octaves per second. Measured over ten seconds, Hold moved
  // the picture by 233 and Zoom In by 250: the Motion control was doing about 7%
  // of the visible work and the shape drift was doing the rest, so every setting
  // looked the same and the control read as broken.
  #define KSPAN 2.5
  float depth = 0.0;
  if (u_kmode < 0.5) depth = diveCycle(u_journeyPhase * 0.10);
  else if (u_kmode < 1.5) depth = 1.0 - diveCycle(u_journeyPhase * 0.10);
  // Frequency tied to the dive rate: widening KSPAN without touching this left
  // Ping-Pong travelling three times faster than Zoom In on the same slider.
  else if (u_kmode < 2.5) depth = 0.5 - 0.5 * cos(u_journeyPhase * 0.10 * PI);
  float scale = exp2(-depth * KSPAN);

  vec2 p = ctr(v_uv) * 2.0 / u_kzoom * scale;
  p = rot2(u_kspinPhase * 0.15) * p;

  // Hold parks the zoom; the shape keeps drifting so it never freezes into a still
  // image. Shape Drift decides how much: at 0 the creature holds its form and you
  // see the zoom on its own, which is what the Motion control is for.
  float t = u_time * 0.12;
  float wob = 0.13 * u_kdrift;
  vec2 c = vec2(u_shapex + wob * sin(t * 1.3), u_shapey + wob * cos(t * 0.9));

  float trap = 1e9;
  float acc = 0.0;
  float lineTrap = 1e9;
  int n = int(u_iter);
  for (int i = 0; i < 16; i++) {
    if (i >= n) break;
    // The centre pixel can start exactly at (0,0), where a bare 1/dot(p,p) is 0/0
    // -> NaN -> a black speck. The spiral fold already guarded it; do the same for
    // the other three.
    float q = max(dot(p, p), 0.06);
    if (u_kformula < 0.5) {
      p = abs(p) / q - c;                              // classic Kali
    } else if (u_kformula < 1.5) {
      p = abs(p) / q - c;
      p = rot2(0.35) * p;                              // spiral fold
    } else if (u_kformula < 2.5) {
      p = vec2(abs(p.x) - abs(p.y), abs(p.x * p.y) * 2.0) / q - c; // burning fold
    } else {
      p = abs(p);
      if (p.x < p.y) p = p.yx;
      p = p / q - c;                                   // triangle fold
    }
    float m = dot(p, p);
    trap = min(trap, abs(sqrt(m) - 0.35));
    lineTrap = min(lineTrap, abs(p.x));
    acc += exp(-m * 2.5);
  }

  float glow = exp(-trap * 16.0) + exp(-lineTrap * 22.0) * 0.7;
  float v = acc / float(n);
  vec3 col = pal(v * 2.2 + sqrt(trap) * 1.4 + u_time * 0.02);
  col *= 0.12 + (0.8 + u_kglow * 1.4) * glow;
  col = pow(col, vec3(1.2));
  fragColor = vec4(col, 1.0);
}
