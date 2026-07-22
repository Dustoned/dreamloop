uniform float u_ndrift;
uniform float u_ndriftPhase;   // integral of u_ndrift: rate, not rescaled history
uniform float u_ndensity;
uniform float u_ndetail;
uniform float u_nstars;
uniform float u_ncontrast;

/**
 * fbm that gives up as soon as the octaves still to come cannot possibly lift the
 * sum to the cloud threshold. The remaining amplitudes of a halving series sum to
 * the current one, so `v + amp` is a true upper bound on the final value — the
 * early exit costs no accuracy at all.
 *
 * Most of a nebula is empty sky, and the old version paid the full octave count
 * for every one of those samples. That was the whole reason this scene crawled.
 */
float gas(vec3 p, int oct, float thresh) {
  // Normalised by the total amplitude this octave count can reach, so the cloud
  // threshold means the same thing at every Detail setting. Without it, 2 octaves
  // top out at 0.75 and a low Gas Density renders a completely black screen.
  float total = 1.0 - exp2(-float(oct));
  float need = thresh * total;
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    v += amp * vnoise3(p);
    if (v + amp < need) return 0.0;
    p = vec3(mat2(1.6, 1.2, -1.2, 1.6) * p.xy, p.z * 2.1 + 7.7);
    amp *= 0.5;
  }
  return v / max(total, 0.001);
}

// Volumetric flight through fbm gas clouds, stars behind.
void main() {
  vec2 sc = ctr(v_uv) * 1.6;
  float t = u_ndriftPhase * 0.35;
  vec3 ro = vec3(0.0, 0.0, t);
  vec3 rd = normalize(vec3(sc, 1.0));
  rd.xy = rot2(sin(t * 0.18) * 0.25) * rd.xy;

  vec3 col = vec3(0.0);
  float trans = 1.0;
  // Per-pixel start offset: with the longer strides below, an aligned start would
  // show up as concentric shells. Noise turns that into film grain instead.
  float z = 0.4 + hash21(gl_FragCoord.xy) * 0.3;
  int oct = int(u_ndetail);
  float thresh = 0.92 - u_ndensity * 0.5;
  int MARCH = marchSteps(14, 34);
  for (int i = 0; i < 34; i++) {
    if (i >= MARCH) break;
    vec3 p = ro + rd * z;
    float den = clamp((gas(p * 0.85, oct, thresh) - thresh) * 3.2, 0.0, 1.0);
    if (den > 0.01) {
      vec3 c = pal(den * 1.1 + z * 0.07 + u_time * 0.015);
      col += c * (den * den * 0.7 + den * 0.5) * trans * 0.4;
      trans *= 1.0 - den * 0.3;
      if (trans < 0.04) break;
      z += 0.26;
    } else {
      z += 0.46;   // nothing here: stride on
    }
  }

  // stars shining through the gaps
  vec2 q = rd.xy / (abs(rd.z) + 0.3) * 7.0 + vec2(t * 0.4, 0.0);
  vec2 cell = floor(q);
  vec2 f = fract(q) - 0.5;
  vec2 jit = hash22(cell) - 0.5;
  float star = smoothstep(0.045, 0.0, length(f - jit * 0.7));
  star *= step(0.75, hash21(cell + 5.1));
  float tw = 0.6 + 0.4 * sin(u_time * (2.0 + 3.0 * hash21(cell)) + hash21(cell) * TAU);
  col += vec3(1.0) * star * tw * trans * u_nstars;

  col = pow(col, vec3(u_ncontrast));
  fragColor = vec4(col, 1.0);
}
