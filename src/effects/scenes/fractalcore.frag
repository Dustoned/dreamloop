uniform float u_ffly;
uniform float u_ffold;
uniform float u_fwarp;
uniform float u_fglow;
uniform float u_fiter2;

// Raymarched kaleidoscopic IFS in endlessly repeating space.
float de(vec3 p, float rotA, out float trap) {
  p = mod(p + 1.5, 3.0) - 1.5;
  float scale = u_ffold;
  float factor = 1.0;
  trap = 1e9;
  mat2 rm = rot2(rotA);
  int n = int(u_fiter2);
  for (int i = 0; i < 9; i++) {
    if (i >= n) break;
    p = abs(p);
    if (p.x < p.y) p.xy = p.yx;
    if (p.x < p.z) p.xz = p.zx;
    if (p.y < p.z) p.yz = p.zy;
    p.xy = rm * p.xy;
    p = p * scale - vec3(scale - 1.0);
    factor *= scale;
    trap = min(trap, length(p));
  }
  return length(p) / factor * 0.9;
}

void main() {
  float t = u_time * u_ffly;
  float rotA = u_fwarp * (0.35 + 0.25 * sin(u_time * 0.13));
  vec3 ro = vec3(0.45 * sin(t * 0.31), 0.45 * cos(t * 0.24), t);
  vec2 sc = ctr(v_uv) * 1.8;
  sc = rot2(sin(t * 0.2) * 0.4) * sc;
  vec3 rd = normalize(vec3(sc, 1.0));

  float dist = 0.0;
  float glow = 0.0;
  float hit = -1.0;
  float trap = 0.0;
  float steps = 0.0;
  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * dist;
    float tr;
    float d = de(p, rotA, tr);
    glow += exp(-d * 14.0);
    if (d < 0.004) {
      hit = dist;
      trap = tr;
      steps = float(i);
      break;
    }
    dist += d * 0.85;
    if (dist > 12.0) break;
  }

  vec3 col = vec3(0.0);
  if (hit > 0.0) {
    float ao = 1.0 - steps / 64.0; // step-count ambient occlusion
    col = pal(trap * 1.4 + u_time * 0.02);
    col *= ao * (0.45 + 1.2 * exp(-hit * 0.28));
  }
  col += pal(0.1 + trap * 0.4 + u_time * 0.025) * glow * u_fglow * 0.008;
  fragColor = vec4(col, 1.0);
}
