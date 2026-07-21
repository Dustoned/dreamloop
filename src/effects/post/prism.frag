uniform float u_pstrength;
uniform float u_pmode;

void main() {
  vec2 d = v_uv - 0.5;
  float r = length(d) * 2.0;
  float amt = u_pstrength * 0.035 * r * r; // center stays sharp
  vec2 dir = normalize(d + 1e-6);
  if (u_pmode > 0.5) dir = vec2(-dir.y, dir.x); // angular twist mode
  vec3 col;
  col.r = texture(u_src, v_uv + dir * amt).r;
  col.g = texture(u_src, v_uv).g;
  col.b = texture(u_src, v_uv - dir * amt).b;
  fragColor = vec4(col, 1.0);
}
