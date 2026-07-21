uniform float u_psize;
uniform float u_pgap;

void main() {
  // square cells in device pixels
  vec2 px = u_psize * u_texel;
  vec2 cell = floor(v_uv / px);
  vec3 c = texture(u_src, (cell + 0.5) * px).rgb;

  vec2 f = fract(v_uv / px);
  float edge = smoothstep(0.0, 0.18, f.x) * smoothstep(1.0, 0.82, f.x) *
               smoothstep(0.0, 0.18, f.y) * smoothstep(1.0, 0.82, f.y);
  c *= mix(1.0, edge, u_pgap);
  fragColor = vec4(c, 1.0);
}
