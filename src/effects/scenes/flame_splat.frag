#version 300 es
precision highp float;

// Additive splat: rgb accumulates colour, alpha accumulates hit count (density).
// Blend mode is GL_ONE, GL_ONE, so each plotted point adds itself to the buffer.
in vec3 v_col;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_col, 1.0);
}
