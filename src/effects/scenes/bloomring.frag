uniform float u_bsegments;
uniform float u_bpetal;
uniform float u_bspin2;
uniform float u_bspin2Phase;   // integral of u_bspin2: rate, not rescaled history
uniform float u_bbreath;
uniform float u_bglow2;
uniform float u_bdrive;

// Kaleidoscopic bloom, in the spirit of the geometric Media Player visualisers.
//
// Music-first: the petal outline is drawn straight from the three bands. Bass
// swells the whole flower, mid ripples the petal edges, treble stipples the fine
// serration along them. One clear shape that breathes with the track, rather than
// a texture you have to search for the music in.
//
// Nothing here loops or resets: every term is either a rotation or a continuous
// function of the integrated phase.
void main() {
  vec2 p = ctr(v_uv);
  float amt = clamp(u_audioAmt, 0.0, 1.0);
  float bass = mix(0.20, u_audio.x, amt);
  float mid = mix(0.16, u_audio.y, amt);
  float treb = mix(0.12, u_audio.z, amt);
  float beat = u_audio.w * amt;

  float r = length(p);
  float a = atan(p.y, p.x) + u_bspin2Phase * 0.35;

  float seg = max(u_bsegments, 2.0);
  // Mirror-folded angle: the flower is symmetric, which is what makes it read as
  // a shape rather than noise.
  float fold = foldAngle(a, seg);

  // The petal outline, band by band.
  float edge = 0.30
    + 0.20 * bass * u_bdrive
    + 0.085 * u_bpetal * cos(fold * seg)
    + 0.055 * mid * u_bdrive * cos(fold * seg * 2.0 + u_time * 0.9)
    + 0.030 * treb * u_bdrive * cos(fold * seg * 5.0 - u_time * 1.7);

  // Slow breathing so it is alive even in a quiet passage.
  edge *= 1.0 + u_bbreath * 0.12 * sin(u_time * 0.31);
  // The beat opens the flower a little, then it settles back.
  edge *= 1.0 + beat * 0.16;

  float d = abs(r - edge);
  float rim = 0.012 / (d + 0.012);

  // A second, larger ghost of the same outline gives depth without extra clutter.
  float d2 = abs(r - edge * 1.55);
  float rim2 = 0.020 / (d2 + 0.020);

  // Filled interior, kept dim so the rim stays the subject.
  float fill = smoothstep(edge, edge - 0.14, r);

  float t = r * 1.1 + fold * 0.4 + u_time * 0.04;
  vec3 col = pal(t) * rim * rim * (0.7 + u_bglow2 * 1.8);
  col += pal(t + 0.28) * rim2 * rim2 * 0.35;
  col += pal(t + 0.5) * fill * (0.05 + bass * 0.16);

  // Treble sparkles along the rim rather than over the whole frame.
  float spark = hash21(floor(vec2(fold * 90.0, r * 60.0)) + floor(u_time * 14.0));
  col += pal(t + 0.7) * rim * step(0.93, spark) * treb * 1.1;

  col *= 1.0 + beat * 0.35;
  col = col / (1.0 + col * 0.35);
  fragColor = vec4(max(col, 0.0), 1.0);
}
