uniform float u_tscale;
uniform float u_relief;

// Displays the Gray-Scott sim (bound as u_prev) with palette + pseudo-lighting.
void main() {
  vec2 uv = (v_uv - 0.5) / u_tscale + 0.5;
  float B = texture(u_prev, uv).y;
  float bx = texture(u_prev, uv + vec2(1.0 / 512.0, 0.0)).y - B;
  float by = texture(u_prev, uv + vec2(0.0, 1.0 / 512.0)).y - B;
  float light = 1.0 + u_relief * 10.0 * (bx - by);

  vec3 bg = pal(0.02 + u_time * 0.02) * 0.2;
  vec3 fg = pal(0.3 + B * 1.2 + u_time * 0.02) * (0.5 + B * 1.6);
  vec3 col = mix(bg, fg, smoothstep(0.03, 0.25, B)) * light;
  fragColor = vec4(col, 1.0);
}
