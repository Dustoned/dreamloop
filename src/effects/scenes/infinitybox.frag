uniform float u_mvariant;
uniform float u_mzoom;
uniform float u_mzoomPhase;   // integral of u_mzoom: rate, not rescaled history
uniform float u_mtwist;
uniform float u_moffset;
uniform float u_miters;
uniform float u_mglow;

// Menger-style sponge. The structure repeats exactly every factor of 3, so taking
// fract() of the zoom depth against log2(3) makes the dive genuinely endless —
// at fract()==0 and fract()==1 the geometry is identical, so there is no seam.
#define L3 1.5849625  // log2(3)

float boxDE(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float crossDE(vec3 p) {
  vec3 a = abs(p);
  float da = max(a.x, a.y);
  float db = max(a.y, a.z);
  float dc = max(a.z, a.x);
  return min(da, min(db, dc)) - 1.0;
}

float de(vec3 p, mat2 rstep, out float trap, out float lvl) {
  float d = boxDE(p, vec3(1.0));
  float s = 1.0;
  trap = 1e9;
  lvl = 0.0;
  mat2 rm = mat2(1.0, 0.0, 0.0, 1.0);
  int n = int(u_miters);
  for (int i = 0; i < 10; i++) {
    if (i >= n) break;
    vec3 a = mod(p * s, 2.0) - 1.0;
    s *= 3.0;
    vec3 r = abs(1.0 - u_moffset * 3.0 * abs(a));
    // Accumulate the per-level rotation instead of calling rot2 (a sin and a cos)
    // on every one of up to 900 inner iterations per pixel.
    rm = rstep * rm;
    r.xy = rm * r.xy;

    float c;
    if (u_mvariant < 0.5) {
      c = crossDE(r) / s;                                   // Menger sponge
    } else if (u_mvariant < 1.5) {
      c = (min(max(abs(r.x), abs(r.y)), abs(r.z)) - 1.0) / s; // cross lattice
    } else {
      c = (boxDE(r, vec3(1.0, 1.0, 1.0)) - 0.35) / s;        // jerusalem-ish cube
    }

    if (c > d) {
      d = c;
      lvl = float(i) + 1.0;
    }
    trap = min(trap, length(r) * 0.35);
  }
  return d;
}

void main() {
  // This was a fract() wrap on log2(3), on the assumption that the sponge is
  // exactly self-similar under a factor of three. Measured against the running
  // image it is not: the wrap was the worst frame step in the entire cycle, 6.7x
  // the median. A dive with an eased pull-back has no wrap to give away.
  float depth = diveCycle(u_mzoomPhase * 0.03) * 3.0;
  float zoom = exp2(-depth);

  vec2 sc = ctr(v_uv) * 1.7;
  sc = rot2(u_time * 0.05) * sc;
  vec3 ro = vec3(0.14 * sin(u_time * 0.11), 0.14 * cos(u_time * 0.09), -3.4) * zoom;
  vec3 rd = normalize(vec3(sc * zoom, zoom));

  float dist = 0.0;
  float glow = 0.0;
  float hit = -1.0;
  float trap = 0.0;
  float lvl = 0.0;
  float steps = 0.0;
  float maxD = 9.0 * zoom;
  float eps = 0.0009 * zoom;

  mat2 rstep = rot2(u_mtwist * 0.5);
  int MARCH = marchSteps(34, 90);
  for (int i = 0; i < 90; i++) {
    if (i >= MARCH) break;
    vec3 p = ro + rd * dist;
    float tr, lv;
    float d = de(p, rstep, tr, lv);
    glow += exp(-abs(d) / (0.03 * zoom));
    if (d < eps) {
      hit = dist;
      trap = tr;
      lvl = lv;
      steps = float(i);
      break;
    }
    dist += d * 0.85;
    if (dist > maxD) break;
  }

  vec3 col = vec3(0.0);
  if (hit > 0.0) {
    float ao = clamp(1.0 - steps / 90.0, 0.0, 1.0);
    ao = ao * ao * 0.8 + 0.2;
    // colour follows the fold level, so the endless dive keeps cycling the palette
    float t = lvl * 0.13 + trap * 0.5 - depth * 0.35 + u_time * 0.02;
    col = pal(t) * ao * (0.35 + 0.85 * exp(-hit / (3.0 * zoom)));
    col += pal(t + 0.3) * pow(ao, 4.0) * 0.35;
  }
  col += pal(0.1 + trap * 0.4 + u_time * 0.025) * glow * u_mglow * 0.006;

  col = col / (1.0 + col * 0.3);
  fragColor = vec4(max(col, 0.0), 1.0);
}
