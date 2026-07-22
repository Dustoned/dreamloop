uniform float u_persist;
uniform float u_fzoom;
uniform float u_fspin;
uniform float u_driftx;
uniform float u_drifty;
uniform float u_fblend;
uniform float u_enabled;

void main() {
  vec3 scene = textureLod(u_src, v_uv, 0.0).rgb;

  vec2 p = v_uv - 0.5;
  p = rot2(u_fspin * 0.045) * p;
  p *= 1.0 - u_fzoom * 0.055;
  p += vec2(u_driftx, u_drifty) * 0.008;
  vec3 prev = textureLod(u_prev, p + 0.5, 0.0).rgb;

  float persist = u_persist * u_enabled;
  vec3 smear = mix(scene, prev, persist);
  vec3 trails = max(scene, prev * persist);
  fragColor = vec4(mix(smear, trails, u_fblend), 1.0);
}
