uniform float u_scale;
uniform float u_waves;
uniform float u_wiggle;
uniform float u_soft;

void main() {
  vec2 p = ctr(v_uv) * u_scale * 3.0;
  float t = u_time * 0.6;

  float v = sin(p.x * 1.7 + t);
  v += sin(p.y * 1.3 - t * 1.3);
  float n = 2.0;
  if (u_waves > 2.5) { v += sin((p.x + p.y) * 1.1 + t * 0.7); n += 1.0; }
  if (u_waves > 3.5) { v += sin(length(p - vec2(sin(t * 0.43), cos(t * 0.31)) * 2.0) * 1.9); n += 1.0; }
  if (u_waves > 4.5) { v += sin(length(p + vec2(cos(t * 0.27), sin(t * 0.37)) * 2.5) * 2.3 - t); n += 1.0; }
  v /= n;

  v += u_wiggle * 0.5 * sin(v * 4.0 + t * 1.2);

  float tt = 0.5 + 0.5 * v;
  tt = mix(tt, tt * tt * (3.0 - 2.0 * tt), u_soft);
  vec3 col = pal(tt + u_time * 0.02);
  fragColor = vec4(col, 1.0);
}
