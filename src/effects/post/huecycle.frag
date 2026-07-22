uniform float u_cyclespeed;
uniform float u_sat;

// Rodrigues rotation of the RGB vector around the gray axis = hue rotation.
vec3 hueRotate(vec3 c, float a) {
  const vec3 k = vec3(0.57735026919);
  float cs = cos(a);
  float sn = sin(a);
  return c * cs + cross(k, c) * sn + k * dot(k, c) * (1.0 - cs);
}

void main() {
  vec3 c = textureLod(u_src, v_uv, 0.0).rgb;
  c = hueRotate(c, u_time * u_cyclespeed);
  c = mix(vec3(luma(c)), c, u_sat);
  fragColor = vec4(clamp(c, 0.0, 2.0), 1.0);
}
