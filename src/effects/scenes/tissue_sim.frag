uniform float u_feed;
uniform float u_kill;
uniform float u_stir;
uniform float u_seedMode;

// Gray-Scott reaction-diffusion, one step per pass. State in u_prev.xy = (A, B).
void main() {
  vec2 uv = v_uv;

  if (u_seedMode > 0.5) {
    // noise patches across the whole field so the pattern develops everywhere
    float b = step(0.75, vnoise(uv * 14.0)) * 0.9;
    b += step(0.8, vnoise(uv * 31.0 + 17.3)) * 0.6;
    fragColor = vec4(1.0, clamp(b, 0.0, 1.0), 0.0, 1.0);
    return;
  }

  vec2 t = u_texel;
  vec2 c = texture(u_prev, uv).xy;
  // 3x3 Laplacian: center -1, orthogonal 0.2, diagonal 0.05
  vec2 lap = -c;
  lap += 0.2 * (texture(u_prev, uv + vec2(t.x, 0.0)).xy + texture(u_prev, uv - vec2(t.x, 0.0)).xy +
                texture(u_prev, uv + vec2(0.0, t.y)).xy + texture(u_prev, uv - vec2(0.0, t.y)).xy);
  lap += 0.05 * (texture(u_prev, uv + t).xy + texture(u_prev, uv - t).xy +
                 texture(u_prev, uv + vec2(t.x, -t.y)).xy + texture(u_prev, uv - vec2(t.x, -t.y)).xy);

  float A = c.x;
  float B = c.y;
  float reaction = A * B * B;
  A = clamp(A + (1.0 * lap.x - reaction + u_feed * (1.0 - A)), 0.0, 1.0);
  B = clamp(B + (0.5 * lap.y + reaction - (u_kill + u_feed) * B), 0.0, 1.0);

  // occasional random stir splats keep the tissue alive
  float tick = floor(u_time * 2.0);
  float gate = step(1.0 - u_stir * 0.35, hash11(tick + 0.5));
  vec2 splat = hash22(vec2(tick, 11.7));
  B += gate * 0.5 * smoothstep(0.02, 0.0, distance(uv, splat));

  fragColor = vec4(A, clamp(B, 0.0, 1.0), 0.0, 1.0);
}
