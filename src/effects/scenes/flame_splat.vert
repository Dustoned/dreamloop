#version 300 es
precision highp float;

// Fractal-flame splat: each vertex runs an independent "chaos game" through an
// iterated function system and plots ONE point. Draw a few hundred thousand of
// these additively into a float buffer and the density builds up into the classic
// glowing, smoky flame. The system breathes with u_fmorphPhase and folds through an
// n-fold rotational symmetry, so it always looks designed rather than random.
uniform float u_time;
uniform vec4 u_audio;        // bass, mid, treble, beat
uniform float u_audioAmt;
uniform vec2 u_res;
uniform float u_frame;
uniform sampler2D u_palette;
uniform float u_palShift;
uniform float u_palSpread;

uniform float u_fvar;        // variation (creature type) 0..6
uniform float u_fsym;        // rotational symmetry 1..8
uniform float u_ftwist;      // radial twist 0..1
uniform float u_fzoom;       // framing scale
uniform float u_fspread;     // map contraction / openness
uniform float u_fmorphPhase; // integrated Morph Speed
uniform float u_fspinPhase;  // integrated Spin

out vec3 v_col;

const float PI = 3.14159265;
const float TAU = 6.28318530;

float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
vec2 h22(float n) { return fract(sin(vec2(n * 127.1, n * 311.7)) * 43758.5453); }

vec3 pal(float t) {
  t = fract(t * u_palSpread + u_palShift);
  return texture(u_palette, vec2(t, 0.5)).rgb;
}

vec2 rot(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c) * p;
}

// Each variation settles the chaos game at a different natural size; this brings
// them all to roughly the same on-screen fill so no Creature renders as a speck.
float varScale(int v) {
  if (v == 0) return 3.0;   // sinusoidal (contracts small)
  if (v == 1) return 0.62;  // spherical (spreads wide)
  if (v == 2) return 1.05;  // swirl
  if (v == 3) return 1.6;   // horseshoe
  if (v == 4) return 3.0;   // polar
  if (v == 5) return 2.2;   // handkerchief
  return 0.62;              // disc (spreads wide)
}

// A handful of the classic flame "variations" (nonlinear warps). Each turns the
// same affine skeleton into a completely different creature.
vec2 variation(int v, vec2 p) {
  float r = length(p) + 1e-6;
  float th = atan(p.y, p.x);
  if (v == 0) return sin(p);                                      // sinusoidal
  if (v == 1) return p / (r * r);                                 // spherical
  if (v == 2) { float s = sin(r * r), c = cos(r * r); return vec2(p.x * s - p.y * c, p.x * c + p.y * s); } // swirl
  if (v == 3) return vec2((p.x - p.y) * (p.x + p.y), 2.0 * p.x * p.y) / r; // horseshoe
  if (v == 4) return vec2(th / PI, r - 1.0);                      // polar
  if (v == 5) return r * vec2(sin(th + r), cos(2.0 * th));        // handkerchief
  return vec2(sin(th) / r, cos(th) * r);                          // disc
}

void main() {
  float id = float(gl_VertexID);
  // Fresh randomness every frame so the accumulation fills in new samples; the
  // decaying buffer averages them into a smooth image.
  float seed = id * 0.0011 + u_frame * 0.61803;
  vec2 p = h22(seed) * 2.0 - 1.0;
  float ci = h11(seed + 7.7);

  int V = int(u_fvar + 0.5);
  float sym = max(1.0, floor(u_fsym + 0.5));
  float mph = u_fmorphPhase;
  float sp = 0.42 + 0.42 * u_fspread;  // contraction factor: keeps the game bounded

  for (int i = 0; i < 24; i++) {
    float r = h11(seed + float(i) * 1.37 + 0.11);
    if (r < 0.5) {
      p = rot(p * sp, 0.6 + 0.4 * sin(mph * 0.7));
      p += vec2(0.55 * sin(mph * 0.5), 0.55 * cos(mph * 0.6));
      ci = mix(ci, 0.15, 0.5);
    } else {
      p = rot(p * sp, -0.9 + 0.5 * cos(mph * 0.4));
      p += vec2(-0.6 * cos(mph * 0.3), 0.55 * sin(mph * 0.45));
      ci = mix(ci, 0.72, 0.5);
    }
    p = variation(V, p);
    if (u_ftwist > 0.001) p = rot(p, u_ftwist * length(p) * 1.5);
    p = clamp(p, -8.0, 8.0);       // stability guard against the expansive variations
  }

  // n-fold rotational symmetry, applied to the FINAL point: drop it into one of N
  // sectors chosen at random. This is what gives the clean mandala symmetry, and it
  // recentres the cloud on the origin (a lopsided attractor becomes an N-armed ring).
  float ks = floor(h11(seed + 5.7) * sym);
  p = rot(p, TAU * ks / sym + u_fspinPhase * 0.3);
  v_col = pal(ci + 0.02 * u_time);

  vec2 clip = p * (0.42 * u_fzoom * varScale(V));
  clip.x *= u_res.y / u_res.x;      // keep the flame circular, not stretched
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = 1.0;
}
