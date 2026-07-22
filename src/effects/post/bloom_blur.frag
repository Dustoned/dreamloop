uniform vec2 u_dir; // blur direction scaled by radius, set by the engine

void main() {
  vec2 off = u_dir * u_texel;
  vec3 acc = textureLod(u_src, v_uv, 0.0).rgb * 0.227027;
  acc += (textureLod(u_src, v_uv + off * 1.3846, 0.0).rgb + textureLod(u_src, v_uv - off * 1.3846, 0.0).rgb) * 0.3162162;
  acc += (textureLod(u_src, v_uv + off * 3.2308, 0.0).rgb + textureLod(u_src, v_uv - off * 3.2308, 0.0).rgb) * 0.0702703;
  fragColor = vec4(acc, 1.0);
}
