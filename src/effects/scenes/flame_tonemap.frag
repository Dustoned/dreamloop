// Log-density tone map: the innovation that makes flames readable. The accumulation
// buffer holds summed colour (rgb) and hit count (alpha) per pixel. Dense cores would
// blow out and thin wisps would vanish under a linear map; log density compresses the
// enormous range so both the bright heart and the faint smoke show at once.
uniform float u_fbright;

void main() {
  vec4 acc = texture(u_src, v_uv);
  float dens = acc.a;
  vec3 hue = acc.rgb / max(dens, 1e-4);   // density-weighted average colour

  float ld = log(1.0 + dens * (0.4 + u_fbright * 6.0)) / log(1.0 + 120.0);
  ld = pow(clamp(ld, 0.0, 1.0), 1.0 / 1.4);   // gentle gamma lift suits flames

  vec3 col = hue * ld;
  col += hue * ld * ld * 0.35;            // a little extra bloom in the cores
  fragColor = vec4(max(col, 0.0), 1.0);
}
