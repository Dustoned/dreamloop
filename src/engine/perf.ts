/**
 * Rolling-median frame-time monitor with hysteresis. Degrades the internal
 * resolution in 12.5% steps (floor 40%) when the median stays above ~52fps
 * budget, recovers slowly when comfortably fast.
 */
export class PerfMonitor {
  degrade = 1;
  fps = 60;
  /** Set once after the first degrade so the UI can explain what happened. */
  justDegraded = false;

  private times: number[] = [];
  private lastDegrade = 0;
  private lastRecover = 0;

  sample(dtMs: number, now: number): void {
    if (dtMs <= 0 || dtMs > 500) return;
    this.times.push(dtMs);
    if (this.times.length > 60) this.times.shift();
    if (this.times.length < 40) return;

    const sorted = [...this.times].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    this.fps = 1000 / median;

    if (median > 19 && now - this.lastDegrade > 2000 && this.degrade > 0.4) {
      this.degrade = Math.max(0.4, this.degrade - 0.125);
      this.lastDegrade = now;
      this.lastRecover = now;
      this.times.length = 0;
      this.justDegraded = true;
    } else if (median < 13 && now - this.lastRecover > 15000 && this.degrade < 1) {
      this.degrade = Math.min(1, this.degrade + 0.125);
      this.lastRecover = now;
      this.times.length = 0;
    }
  }
}
