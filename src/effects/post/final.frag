uniform float u_vig;
uniform float u_vigsoft;
uniform float u_grain;
uniform float u_enabled;
// pulse, flash, sparkle — already scaled by the audio-reactivity amount CPU-side.
// (u_audioFx2 — sway, colour-kick — is declared in the shared prelude.)
uniform vec3 u_audioFx;
// x = bass warp (liquid ripple on the sub-bass); y/z spare
uniform vec3 u_audioFx3;
// global image grade: brightness, contrast, saturation
uniform vec3 u_grade;
// global static hue rotation, radians
uniform float u_hue;

// Rodrigues rotation of a colour about the grey axis — a clean hue turn that
// leaves brightness alone.
vec3 rotateHue(vec3 c, float a) {
  vec3 k = vec3(0.57735);
  return c * cos(a) + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - cos(a));
}

void main() {
  vec2 uv = v_uv;
  // Bass pulse: a push toward the centre on the sub-bass. The engine's master curve
  // keeps low Audio Reactivity gentle; this multiplier sets the ceiling. Beat Zoom
  // Punch (u_audioFx2.z) adds a sharper outward kick on the beat.
  uv = 0.5 + (uv - 0.5) * (1.0 - u_audioFx.x * 0.05 + u_audioFx2.z * 0.10);

  // Mid sway: a slow whole-frame roll on the mids. Tiny angle; it reads as the
  // image leaning with the music rather than spinning.
  // The lean direction wanders with sin(), but its magnitude is floored: without
  // the floor the sway vanished completely twice per cycle — the chip felt dead.
  float swDir = sin(u_time * 0.7);
  float sway = u_audioFx2.x * 0.10 * sign(swDir) * max(abs(swDir), 0.45);
  vec2 q = uv - 0.5;
  float cs = cos(sway), sn = sin(sway);
  uv = 0.5 + mat2(cs, -sn, sn, cs) * q;

  // Bass warp: the sub-bass sends a liquid ripple through the whole frame —
  // concentric rings racing outward from the centre, faded near it so it never tears.
  float wa = u_audioFx3.x;
  if (wa > 0.001) {
    vec2 wq = uv - 0.5;
    float wr = length(wq);
    uv += normalize(wq + 1e-5) * sin(wr * 26.0 - u_time * 5.0) * wa * 0.035
        * smoothstep(0.0, 0.22, wr);
  }

  vec3 c = textureLod(u_src, uv, 0.0).rgb;

  // Beat flash: a clear pop per kick at the default master, a strobe at max.
  c *= 1.0 + u_audioFx.y * 0.25;

  // Global grade: brightness, contrast around mid grey, saturation.
  c *= u_grade.x;
  c = (c - 0.5) * u_grade.y + 0.5;
  c = mix(vec3(luma(c)), c, u_grade.z);

  // Static global hue offset plus the beat colour kick, in one rotation.
  float a = u_hue + u_audioFx2.y * 0.5;
  if (abs(a) > 0.001) c = rotateHue(c, a);

  // Vignette.
  float d = distance(uv, vec2(0.5)) * 1.41421356;
  float inner = mix(0.55, 0.15, u_vigsoft);
  float vig = 1.0 - u_vig * u_enabled * smoothstep(inner, 1.25, d);
  c *= vig;

  // Grain + treble sparkle: hats and cymbals fizz visibly through the frame.
  float g = hash21(gl_FragCoord.xy + fract(u_time) * 311.7) - 0.5;
  c += g * (u_grain * u_enabled + u_audioFx.z * 0.15);

  // Always-on 1-LSB dither to hide banding.
  c += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
