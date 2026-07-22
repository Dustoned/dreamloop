uniform float u_levels;
uniform float u_pdither;
uniform float u_dscale;

void main() {
  vec3 c = textureLod(u_src, v_uv, 0.0).rgb;
  if (u_pdither > 0.5) {
    // 4x4 ordered Bayer matrix
    vec2 pc = mod(floor(gl_FragCoord.xy / u_dscale), 4.0);
    int idx = int(pc.x) + int(pc.y) * 4;
    const float bayer[16] = float[16](
      0.0, 8.0, 2.0, 10.0,
      12.0, 4.0, 14.0, 6.0,
      3.0, 11.0, 1.0, 9.0,
      15.0, 7.0, 13.0, 5.0
    );
    c += (bayer[idx] / 16.0 - 0.5) / u_levels;
  }
  c = floor(c * u_levels + 0.5) / u_levels;
  fragColor = vec4(c, 1.0);
}
