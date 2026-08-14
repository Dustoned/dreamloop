uniform float u_wamount;    // displacement strength
uniform float u_wsize;      // pattern scale
uniform float u_wflow;      // flow rate
uniform float u_wflowPhase; // integral of u_wflow: rate, not rescaled history
uniform float u_wmode;      // 0 Liquid, 1 Ripple, 2 Twist

// Domain warp: bend the image through a moving displacement field before sampling
// it. Liquid melts everything like heat haze over the whole frame; Ripple sends
// concentric waves out from the centre; Twist wrings the frame around the middle.
void main() {
  vec2 p = ctr(v_uv);
  float t = u_wflowPhase;
  float amt = u_wamount * u_wamount * 0.22; // square the knob: fine control low, drama high
  vec2 uv;

  if (u_wmode < 0.5) {
    // Liquid: two independent fbm channels displace x and y.
    vec2 q = p * u_wsize * 2.0;
    vec2 off = vec2(
      fbm(q + vec2(t * 0.50, 7.7), 3) - 0.5,
      fbm(q + vec2(3.3, t * 0.45), 3) - 0.5);
    uv = v_uv + off * amt * 2.0;
  } else if (u_wmode < 1.5) {
    // Ripple: rings race outward; displacement is radial, fading at the centre so
    // the middle never tears.
    float r = length(p);
    float w = sin(r * u_wsize * 22.0 - t * 3.0) * smoothstep(0.0, 0.15, r);
    uv = v_uv + normalize(p + 1e-5) * w * amt;
  } else {
    // Twist: rotate around the centre, strongest in the middle, breathing with the
    // flow phase so it wrings back and forth instead of winding up forever.
    float r = length(p);
    float a = amt * 26.0 * exp(-r * r * (4.5 / max(u_wsize, 0.2))) * sin(t * 0.9);
    vec2 q = rot2(a) * p;
    uv = v_uv + (q - p) * vec2(u_res.y / u_res.x, 1.0);
  }

  fragColor = vec4(texture(u_src, clamp(uv, 0.001, 0.999)).rgb, 1.0);
}
