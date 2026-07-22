uniform float u_bintensity;
uniform sampler2D u_bloom;

void main() {
  vec3 c = textureLod(u_src, v_uv, 0.0).rgb;
  vec3 b = textureLod(u_bloom, v_uv, 0.0).rgb;
  fragColor = vec4(c + b * u_bintensity, 1.0);
}
