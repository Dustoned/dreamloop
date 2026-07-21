uniform float u_wfly;
uniform float u_wradius;
uniform float u_worganic;
uniform float u_wglow;
uniform float u_wbank;

// Raymarched organic tunnel with a curving flight path.
vec2 path(float z) {
  return vec2(
    sin(z * 0.23) + sin(z * 0.11) * 1.6,
    cos(z * 0.19) + cos(z * 0.093) * 1.6
  ) * 0.7;
}

float wall(vec3 p) {
  vec2 rel = p.xy - path(p.z);
  float r = length(rel);
  float ang = atan(rel.y, rel.x);
  vec2 dir = rel / max(r, 1e-4); // periodic around the tube: no atan seam
  float bump = u_worganic * (
    0.12 * sin(ang * 3.0 + p.z * 0.9) +
    0.08 * sin(ang * 5.0 - p.z * 1.3) +
    0.28 * (vnoise(dir * 1.4 + vec2(p.z * 1.05, 7.0)) - 0.5)
  );
  return u_wradius + bump - r; // positive in open air
}

void main() {
  float t = u_time * u_wfly * 1.8;
  vec3 ro = vec3(path(t), t);
  vec3 target = vec3(path(t + 1.6), t + 1.6);
  vec3 fwd = normalize(target - ro);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);

  vec2 sc = ctr(v_uv) * 2.0;
  sc = rot2(u_wbank * sin(t * 0.35) * 0.7) * sc;
  vec3 rd = normalize(fwd + right * sc.x + up * sc.y);

  float dist = 0.0;
  float glow = 0.0;
  float hit = -1.0;
  for (int i = 0; i < 48; i++) {
    vec3 p = ro + rd * dist;
    float d = wall(p);
    glow += exp(-abs(d) * 6.0);
    if (d < 0.012) {
      hit = dist;
      break;
    }
    dist += max(d * 0.7, 0.02);
    if (dist > 22.0) break;
  }

  vec3 col = vec3(0.0);
  if (hit > 0.0) {
    vec3 p = ro + rd * hit;
    vec2 rel = p.xy - path(p.z);
    vec2 dir = rel / max(length(rel), 1e-4);
    float pattern = fbm(dir * 1.6 + vec2(p.z * 0.6, 3.0), 3);
    col = pal(pattern * 1.4 + p.z * 0.045 + u_time * 0.02) * 1.3;
    col *= 0.5 + 0.85 * exp(-hit * 0.22); // depth fog into darkness
  }
  col += pal(0.62 + u_time * 0.02) * glow * u_wglow * 0.045;
  fragColor = vec4(col, 1.0);
}
