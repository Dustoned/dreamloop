uniform float u_bintensity;
uniform sampler2D u_bloom;

void main() {
  vec3 c = texture(u_src, v_uv).rgb;
  vec3 b = texture(u_bloom, v_uv).rgb;
  fragColor = vec4(c + b * u_bintensity, 1.0);
}
