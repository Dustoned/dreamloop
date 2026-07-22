uniform float u_pcount;
uniform float u_prate;
uniform float u_pratePhase;   // integral of u_prate: rate, not rescaled history
uniform float u_pthick;
uniform float u_pwarp;
uniform float u_pglow;
uniform float u_pdrive;

// Shockwaves on the beat.
//
// Music-first: rings are born at the centre and race outward forever. A shader
// has no memory, so they cannot literally be spawned on a drum hit — instead a
// fixed number of rings ride evenly spaced phases, and the beat envelope brightens
// whichever ring is youngest. The result reads exactly as "the drum threw that
// one out", and it can never fall out of step or run out of rings.
//
// Every ring's phase is fract() of a continuous integral, and a ring is invisible
// at both ends of its life, so nothing ever pops.
void main() {
  vec2 p = ctr(v_uv);
  float amt = clamp(u_audioAmt, 0.0, 1.0);
  float bass = mix(0.18, u_audio.x, amt);
  float mid = mix(0.15, u_audio.y, amt);
  float treb = mix(0.12, u_audio.z, amt);
  float beat = u_audio.w * amt;

  // Warp the plane so the rings are organic rather than perfect circles.
  float wob = u_pwarp * (0.14 + mid * 0.5 * u_pdrive);
  p += wob * vec2(
    sin(p.y * 3.1 + u_time * 0.6),
    cos(p.x * 2.7 - u_time * 0.5)
  ) * 0.15;

  float r = length(p);
  float ang = atan(p.y, p.x);

  int n = int(clamp(u_pcount, 2.0, 10.0));
  float acc = 0.0;
  float hue = 0.0;

  for (int i = 0; i < 10; i++) {
    if (i >= n) break;
    // Evenly spaced ages: one ring is always young, one always old.
    float age = fract(u_pratePhase * 0.22 - float(i) / float(n));

    // Radius grows with a square root, the way a real wavefront spreads: quick at
    // birth, unhurried later.
    // 0.72 keeps the whole life of a ring on screen; at 1.05 most of it expanded
    // past the edge before you ever saw it.
    float rad = sqrt(age) * 0.72;
    // Invisible at birth and at death, so no ring ever appears or vanishes abruptly.
    float life = sin(age * PI);

    // The youngest ring carries the drum hit.
    float youth = smoothstep(0.35, 0.0, age);
    float energy = (0.35 + bass * 1.1 * u_pdrive) * (1.0 + beat * youth * 3.0);

    // Treble ruffles the wavefront into a rosette.
    float ruffle = 1.0 + treb * u_pdrive * 0.09 * cos(ang * 9.0 + float(i) * 2.0);
    float d = abs(r - rad * ruffle);
    float w = u_pthick * (0.010 + 0.030 * age);   // older rings are softer
    float ring = w / (d + w);

    acc += ring * ring * life * energy * 2.2;
    hue += ring * (age * 0.6 + float(i) * 0.07);
  }

  float t = hue / max(acc, 0.001) + r * 0.35 + u_time * 0.03;
  vec3 col = pal(t) * acc * (0.5 + u_pglow * 1.5);

  // A soft core that swells on the bass, so the centre is never a dead spot.
  col += pal(t + 0.45) * bass * bass * 1.6 * exp(-r * 3.5);

  col = col / (1.0 + col * 0.4);
  fragColor = vec4(max(col, 0.0), 1.0);
}
