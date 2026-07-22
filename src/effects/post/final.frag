uniform float u_vig;
uniform float u_vigsoft;
uniform float u_grain;
uniform float u_enabled;
// pulse, flash, sparkle — already scaled by the audio-reactivity amount CPU-side.
uniform vec3 u_audioFx;
// global image grade: brightness, contrast, saturation
uniform vec3 u_grade;

void main() {
  vec2 uv = v_uv;
  // Bass pulse: subtle zoom toward the center.
  uv = 0.5 + (uv - 0.5) * (1.0 - u_audioFx.x * 0.06);
  vec3 c = texture(u_src, uv).rgb;

  // Beat flash.
  c *= 1.0 + u_audioFx.y * 0.35;

  // Global grade: brightness, contrast around mid grey, saturation.
  c *= u_grade.x;
  c = (c - 0.5) * u_grade.y + 0.5;
  c = mix(vec3(luma(c)), c, u_grade.z);

  // Vignette.
  float d = distance(uv, vec2(0.5)) * 1.41421356;
  float inner = mix(0.55, 0.15, u_vigsoft);
  float vig = 1.0 - u_vig * u_enabled * smoothstep(inner, 1.25, d);
  c *= vig;

  // Grain + treble sparkle.
  float g = hash21(gl_FragCoord.xy + fract(u_time) * 311.7) - 0.5;
  c += g * (u_grain * u_enabled + u_audioFx.z * 0.12);

  // Always-on 1-LSB dither to hide banding.
  c += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
