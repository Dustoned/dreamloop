uniform float u_vig;
uniform float u_vigsoft;
uniform float u_grain;
uniform float u_enabled;
// pulse, flash, sparkle — already scaled by the audio-reactivity amount CPU-side.
// (u_audioFx2 — sway, colour-kick — is declared in the shared prelude.)
uniform vec3 u_audioFx;
// global image grade: brightness, contrast, saturation
uniform vec3 u_grade;

void main() {
  vec2 uv = v_uv;
  // Bass pulse: a gentle push toward the centre on the sub-bass. Halved from the
  // old 0.06 — the accent should breathe, not lunge.
  uv = 0.5 + (uv - 0.5) * (1.0 - u_audioFx.x * 0.03);

  // Mid sway: a slow whole-frame roll on the mids. Tiny angle; it reads as the
  // image leaning with the music rather than spinning.
  float sway = u_audioFx2.x * 0.05 * sin(u_time * 0.7);
  vec2 q = uv - 0.5;
  float cs = cos(sway), sn = sin(sway);
  uv = 0.5 + mat2(cs, -sn, sn, cs) * q;

  vec3 c = textureLod(u_src, uv, 0.0).rgb;

  // Beat flash — softened from 0.35 to 0.18.
  c *= 1.0 + u_audioFx.y * 0.18;

  // Global grade: brightness, contrast around mid grey, saturation.
  c *= u_grade.x;
  c = (c - 0.5) * u_grade.y + 0.5;
  c = mix(vec3(luma(c)), c, u_grade.z);

  // Beat colour kick: rotate the hue on each beat (Rodrigues rotation about the
  // grey axis), so the palette twitches with the drum instead of the brightness.
  float a = u_audioFx2.y * 0.5;
  if (a > 0.001) {
    vec3 k = vec3(0.57735);
    c = c * cos(a) + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - cos(a));
  }

  // Vignette.
  float d = distance(uv, vec2(0.5)) * 1.41421356;
  float inner = mix(0.55, 0.15, u_vigsoft);
  float vig = 1.0 - u_vig * u_enabled * smoothstep(inner, 1.25, d);
  c *= vig;

  // Grain + treble sparkle — sparkle eased from 0.12 to 0.08.
  float g = hash21(gl_FragCoord.xy + fract(u_time) * 311.7) - 0.5;
  c += g * (u_grain * u_enabled + u_audioFx.z * 0.08);

  // Always-on 1-LSB dither to hide banding.
  c += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
