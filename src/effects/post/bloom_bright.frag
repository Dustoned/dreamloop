uniform float u_bthreshold;

void main() {
  vec3 c = texture(u_src, v_uv).rgb;
  float k = smoothstep(u_bthreshold, u_bthreshold + 0.25, luma(c));
  fragColor = vec4(c * k, 1.0);
}
