uniform float u_ascale;
uniform float u_azoom;
uniform float u_aspin;
uniform float u_aiters;
uniform float u_athick;
uniform float u_aglow;

// Apollonian sphere packing (Iñigo Quilez's inversion fractal). The structure is
// self-similar under scaling by u_ascale, so cycling the zoom over exactly one
// log(u_ascale) period gives an endless dive with no visible reset.
float de(vec3 p, out float trap, out float gen) {
  float s = 1.0;
  trap = 1e9;
  gen = 0.0;
  int n = int(u_aiters);
  for (int i = 0; i < 12; i++) {
    if (i >= n) break;
    p = -1.0 + 2.0 * fract(0.5 * p + 0.5);
    float r2 = dot(p, p);
    trap = min(trap, r2);
    float k = u_ascale / max(r2, 0.06);
    p *= k;
    s *= k;
    gen += 1.0;
  }
  float thick = mix(0.18, 0.42, u_athick);
  return thick * abs(p.y) / s;
}

void main() {
  // One full self-similar period = log2(u_ascale) in depth.
  float period = max(log2(u_ascale), 0.15);
  float depth = fract(u_time * u_azoom * 0.07);
  float zoom = exp2(-depth * period);

  vec2 sc = ctr(v_uv) * 1.6;
  sc = rot2(u_time * u_aspin * 0.15) * sc;

  float a = u_time * 0.06;
  vec3 ro = vec3(0.9 * sin(a), 0.35 + 0.2 * sin(a * 0.7), 0.9 * cos(a)) * 1.6 * zoom;
  vec3 fwd = normalize(-ro);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);
  vec3 rd = normalize(fwd + right * sc.x + up * sc.y);

  float dist = 0.0;
  float glow = 0.0;
  float hit = -1.0;
  float trap = 0.0;
  float gen = 0.0;
  float steps = 0.0;
  float maxD = 6.0 * zoom;
  float eps = 0.0007 * zoom;

  for (int i = 0; i < 80; i++) {
    vec3 p = ro + rd * dist;
    float tr, g;
    float d = de(p, tr, g);
    glow += exp(-abs(d) / (0.02 * zoom));
    if (d < eps) {
      hit = dist;
      trap = tr;
      gen = g;
      steps = float(i);
      break;
    }
    dist += d * 0.75;
    if (dist > maxD) break;
  }

  vec3 col = vec3(0.0);
  if (hit > 0.0) {
    float ao = clamp(1.0 - steps / 80.0, 0.0, 1.0);
    ao = ao * ao * 0.75 + 0.25;
    // each bubble generation gets its own hue; the dive cycles through them
    float t = sqrt(trap) * 1.6 + gen * 0.06 - depth * 0.4 + u_time * 0.02;
    col = pal(t) * ao * (0.4 + 0.9 * exp(-hit / (2.5 * zoom)));
    col += pal(t + 0.35) * pow(ao, 5.0) * 0.5; // rim highlight on the spheres
  }
  col += pal(0.2 + sqrt(trap) * 0.8 + u_time * 0.025) * glow * u_aglow * 0.005;

  col = col / (1.0 + col * 0.3);
  fragColor = vec4(max(col, 0.0), 1.0);
}
