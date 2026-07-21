let pending = false;

export function requestPhoto(): void {
  pending = true;
}

/**
 * Called by the main loop right after Engine.render, in the same task, so the
 * drawing buffer is still valid without preserveDrawingBuffer.
 */
export function consumePhoto(canvas: HTMLCanvasElement): void {
  if (!pending) return;
  pending = false;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    a.download = `dreamloop-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}
