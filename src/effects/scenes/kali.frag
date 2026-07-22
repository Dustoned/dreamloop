uniform float u_iter;
uniform float u_shapex;
uniform float u_shapey;
uniform float u_kzoom;
uniform float u_journey;
uniform float u_kmode;
uniform float u_kformula;
uniform float u_kspin;
uniform float u_kglow;

// Kali-style IFS. The fold variant (u_kformula) changes the creature completely;
// u_kmode chooses between drifting, endlessly zooming, or holding still.
void main() {
  // Zoom: In / Out / Ping-Pong / Hold, over a 2.5-octave range (~6x). The old
  // version wrapped a single octave with fract() on the assumption that the fold
  // is self-similar at 2x — it is not, so every lap ended in a visible jump.
  #define KSPAN 2.5
  float depth = 0.0;
  if (u_kmode < 0.5) depth = diveCycle(u_time * u_journey * 0.024);
  else if (u_kmode < 1.5) depth = 1.0 - diveCycle(u_time * u_journey * 0.024);
  // Frequency tied to the dive rate: widening KSPAN without touching this left
  // Ping-Pong travelling three times faster than Zoom In on the same slider.
  else if (u_kmode < 2.5) depth = 0.5 - 0.5 * cos(u_time * u_journey * 0.024 * PI);
  float scale = exp2(-depth * KSPAN);

  vec2 p = ctr(v_uv) * 2.0 / u_kzoom * scale;
  p = rot2(u_time * u_kspin * 0.15) * p;

  // Hold parks the zoom; the shape keeps drifting slowly so it never freezes into
  // a still image.
  float t = u_time * 0.12;
  vec2 c = vec2(u_shapex + 0.13 * sin(t * 1.3), u_shapey + 0.13 * cos(t * 0.9));

  float trap = 1e9;
  float acc = 0.0;
  float lineTrap = 1e9;
  int n = int(u_iter);
  for (int i = 0; i < 16; i++) {
    if (i >= n) break;
    if (u_kformula < 0.5) {
      p = abs(p) / dot(p, p) - c;                      // classic Kali
    } else if (u_kformula < 1.5) {
      p = abs(p) / max(dot(p, p), 0.06) - c;
      p = rot2(0.35) * p;                              // spiral fold
    } else if (u_kformula < 2.5) {
      p = vec2(abs(p.x) - abs(p.y), abs(p.x * p.y) * 2.0) / dot(p, p) - c; // burning fold
    } else {
      p = abs(p);
      if (p.x < p.y) p = p.yx;
      p = p / dot(p, p) - c;                           // triangle fold
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
