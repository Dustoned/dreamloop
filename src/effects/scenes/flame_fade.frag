// Decay pass for the flame accumulation buffer: multiply the running density down a
// little each frame. This is what turns a swarm of per-frame samples into a smooth,
// glowing image, and it lets the flame keep up as its shape morphs (old samples fade
// out instead of ghosting forever). u_decay is exp(-dt/tau), computed CPU-side so the
// fade rate is the same at any refresh rate.
uniform float u_decay;

void main() {
  fragColor = texture(u_src, v_uv) * u_decay;
}
