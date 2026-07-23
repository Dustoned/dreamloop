uniform float u_tscale;
uniform float u_relief;

// Displays the Gray-Scott sim (bound as u_prev) with palette + pseudo-lighting.
void main() {
  vec2 uv = (v_uv - 0.5) / u_tscale + 0.5;
  // One sim-texel, whatever size the sim actually runs at (512 on desktop, 256 on
  // phones). A hardcoded 1/512 sampled half a texel off on phones and softened the
  // relief; textureSize reads the real dimensions.
  vec2 tx = 1.0 / vec2(textureSize(u_prev, 0));
  float B = textureLod(u_prev, uv, 0.0).y;
  float bx = textureLod(u_prev, uv + vec2(tx.x, 0.0), 0.0).y - B;
  float by = textureLod(u_prev, uv + vec2(0.0, tx.y), 0.0).y - B;
  float light = 1.0 + u_relief * 10.0 * (bx - by);

  vec3 bg = pal(0.02 + u_time * 0.02) * 0.2;
  vec3 fg = pal(0.3 + B * 1.2 + u_time * 0.02) * (0.5 + B * 1.6);
  vec3 col = mix(bg, fg, smoothstep(0.03, 0.25, B)) * light;
  fragColor = vec4(col, 1.0);
}
