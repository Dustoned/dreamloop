/**
 * Keeps the app responsive on weak hardware by scaling the internal render
 * resolution (and, via the same factor, the detail level of expensive shaders).
 *
 * Design notes:
 * - A single catastrophic frame triggers an immediate cut. Waiting for a rolling
 *   median means that at 5 fps the user would sit through many seconds of frozen
 *   screen before anything happened.
 * - Recovery is slow and stepwise so the picture never oscillates visibly.
 */
export class PerfMonitor {
  /** Multiplier applied to the user's Quality setting, 0.22 .. 1. */
  degrade = 1;
  fps = 60;
  /** Set once each time a reduction happens, so the UI can explain itself. */
  justDegraded = false;

  private times: number[] = [];
  private lastChange = 0;
  private goodSince = 0;

  private static readonly FLOOR = 0.22;
  private static readonly PANIC_MS = 150; // a frame this slow is already a visible freeze
  private static readonly SLOW_MS = 22; // below ~45 fps
  private static readonly FAST_MS = 12; // comfortably above 60 fps
  private static readonly WINDOW = 12; // frames needed for a median decision
  private static readonly COOLDOWN_MS = 700;
  private static readonly RECOVER_AFTER_MS = 4000;

  reset(): void {
    this.times.length = 0;
    this.lastChange = 0;
    this.goodSince = 0;
  }

  /** @param ceiling upper bound for recovery (the user's own Quality slider). */
  sample(dtMs: number, now: number, ceiling = 1): void {
    if (dtMs <= 0 || dtMs > 4000) return;

    // Emergency: one hideously slow frame is enough evidence. Cut hard, at once.
    if (dtMs > PerfMonitor.PANIC_MS && this.degrade > PerfMonitor.FLOOR) {
      this.degrade = Math.max(PerfMonitor.FLOOR, this.degrade * 0.55);
      this.lastChange = now;
      this.goodSince = 0;
      this.times.length = 0;
      this.justDegraded = true;
      return;
    }

    this.times.push(dtMs);
    if (this.times.length > PerfMonitor.WINDOW) this.times.shift();
    if (this.times.length < PerfMonitor.WINDOW) return;

    const sorted = [...this.times].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    this.fps = 1000 / median;

    if (now - this.lastChange < PerfMonitor.COOLDOWN_MS) return;

    if (median > PerfMonitor.SLOW_MS && this.degrade > PerfMonitor.FLOOR) {
      // Cut proportionally to how far over budget we are, so a 200 ms frame drops
      // much further than a 25 ms one.
      const overrun = median / PerfMonitor.SLOW_MS;
      const factor = overrun > 3 ? 0.5 : overrun > 1.8 ? 0.7 : 0.85;
      this.degrade = Math.max(PerfMonitor.FLOOR, this.degrade * factor);
      this.lastChange = now;
      this.goodSince = 0;
      this.times.length = 0;
      this.justDegraded = true;
    } else if (median < PerfMonitor.FAST_MS && this.degrade < ceiling) {
      if (this.goodSince === 0) this.goodSince = now;
      else if (now - this.goodSince > PerfMonitor.RECOVER_AFTER_MS) {
        this.degrade = Math.min(ceiling, this.degrade * 1.15);
        this.lastChange = now;
        this.goodSince = now;
        this.times.length = 0;
      }
    } else {
      this.goodSince = 0;
    }
  }
}

/** Shared instance: the render loop feeds it, the Performance panel reads it. */
export const perfMonitor = new PerfMonitor();
