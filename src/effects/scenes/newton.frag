uniform float u_nk;          // number of roots (power of z^k - 1)
uniform float u_nrelax;      // |a|: relaxation, 1 = classic Newton
uniform float u_naspin;      // rotate a over time -> the basins swirl
uniform float u_naspinPhase;
uniform float u_nnova;       // 0 Newton .. 1 Nova (adds the pixel as a constant)
uniform float u_nzoom;
uniform float u_nspin;
uniform float u_nspinPhase;
uniform float u_nglow;       // glowing basin borders
uniform float u_niters;

// Newton fractal for f(z) = z^k - 1. Every point flows downhill to one of the k
// roots; colour by WHICH root it reaches (the basin) and shade by HOW LONG it took
// (the fractal filigree lives on the basin borders). A complex, slowly rotating
// relaxation coefficient makes the whole pattern swirl; the Nova blend feeds the
// pixel back in as a constant for a wilder, off-centre cousin.
#define VIEW 3.0

vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }

vec2 cdiv(vec2 a, vec2 b) {
  float d = dot(b, b);
  if (d < 1e-30) return vec2(0.0);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d;
}

vec2 cpow(vec2 z, float p) {
  float r2 = dot(z, z);
  if (r2 < 1e-30) return vec2(0.0);
  float rp = exp(0.5 * p * log(r2));
  float a = p * atan(z.y, z.x);
  return rp * vec2(cos(a), sin(a));
}

void main() {
  float k = clamp(floor(u_nk + 0.5), 2.0, 8.0);
  vec2 p = ctr(v_uv) * (VIEW / max(u_nzoom, 0.05));
  p = rot2(u_nspinPhase * 0.1) * p;

  // Relaxation coefficient a = |a|·e^{iθ}; θ turning is what animates the swirl.
  float aang = u_naspinPhase * 0.5;
  vec2 a = u_nrelax * vec2(cos(aang), sin(aang));
  vec2 nova = u_nnova * p;   // Nova: feed the pixel back in as an added constant

  int N = int(clamp(u_niters, 8.0, 80.0));
  vec2 z = p;
  float iter = float(N);
  float aud = 1.0 + u_audio.x * 0.25;

  for (int i = 0; i < 80; i++) {
    if (i >= N) break;
    vec2 f = cpow(z, k) - vec2(1.0, 0.0);
    vec2 df = k * cpow(z, k - 1.0);
    vec2 step = cmul(a, cdiv(f, df));
    z -= step - nova;
    if (dot(step, step) < 1e-7) { iter = float(i); break; }   // converged: stop early
    if (i == N - 1) iter = float(N);
  }

  // Which root did we land on? Roots of z^k = 1 sit at angles 2πj/k.
  float ang = atan(z.y, z.x);
  float j = floor(ang / (TAU / k) + 0.5);
  float basin = fract(j / k + 0.02 * u_time);

  // Fewer iterations = flat basin interior (bright); many = a border (dark filigree).
  float t = clamp(iter / float(N), 0.0, 1.0);
  float body = pow(1.0 - t, 0.6);              // smooth shading toward the root
  float border = smoothstep(0.35, 0.9, t);     // the fractal boundary between basins

  vec3 col = pal(basin) * (0.12 + 0.9 * body);
  col += pal(basin + 0.5) * border * (0.25 + 0.8 * u_nglow) * aud;   // glowing edges
  col += pal(basin + 0.15) * pow(body, 3.0) * 0.25;                   // bright root cores

  col = col / (1.0 + col * 0.25);
  fragColor = vec4(max(col, 0.0), 1.0);
}
