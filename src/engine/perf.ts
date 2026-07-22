/**
 * Keeps the app responsive on weak hardware by scaling the internal render
 * resolution (and, via the same factor, the detail level of expensive shaders).
 *
 * Hard-won design rules, in order of importance:
 *
 * 1. The user always wins. Touching the Quality control clears any penalty
 *    immediately — otherwise "I set everything to maximum and it is still
 *    pixelated" is a true statement, because the setting is only a ceiling.
 * 2. One slow frame proves nothing. Loading a preset, opening a dialog or a
 *    garbage collection all produce a 200 ms frame on a perfectly capable
 *    machine. Only sustained slowness is evidence of a slow device.
 * 3. Known one-off costs are excluded outright: after a scene switch or a
 *    snapshot load the next handful of frames are not measurements.
 * 4. Recovery must be quick enough that a wrong guess is not punishing.
 */
export class PerfMonitor {
  /** Multiplier applied to the user's Quality setting. */
  degrade = 1;
  fps = 60;
  /** Set once each time a reduction happens, so the UI can explain itself. */
  justDegraded = false;

  private times: number[] = [];
  private lastChange = 0;
  private goodSince = 0;
  private consecutiveSlow = 0;
  private ignore = 0;

  /** Never go below this: past here the picture reads as broken, not soft. */
  private static readonly FLOOR = 0.4;
  /** A frame this slow is a visible stutter — but see rule 2. */
  private static readonly PANIC_MS = 250;
  private static readonly SLOW_MS = 24; // below ~42 fps
  private static readonly FAST_MS = 13; // comfortably above 60 fps
  private static readonly WINDOW = 20; // frames per median decision
  private static readonly COOLDOWN_MS = 1200;
  private static readonly RECOVER_AFTER_MS = 2000;

  /** Discard the next n frames — used around known one-off stalls. */
  ignoreFrames(n = 20): void {
    this.ignore = Math.max(this.ignore, n);
    this.times.length = 0;
    this.consecutiveSlow = 0;
  }

  /** Forget the measurement window without touching the current quality. */
  reset(): void {
    this.times.length = 0;
    this.lastChange = 0;
    this.goodSince = 0;
    this.consecutiveSlow = 0;
  }

  /** The user asked for a different quality: drop any penalty and re-evaluate. */
  restore(): void {
    this.degrade = 1;
    this.reset();
    this.ignoreFrames(30);
  }

  /** @param ceiling upper bound for recovery (the user's own Quality slider). */
  sample(dtMs: number, now: number, ceiling = 1): void {
    if (dtMs <= 0 || dtMs > 4000) return;
    if (this.ignore > 0) {
      this.ignore--;
      return;
    }

    // Sustained catastrophe: two slow frames in a row, not one.
    if (dtMs > PerfMonitor.PANIC_MS) {
      this.consecutiveSlow++;
      if (this.consecutiveSlow >= 2 && this.degrade > PerfMonitor.FLOOR) {
        this.degrade = Math.max(PerfMonitor.FLOOR, this.degrade * 0.7);
        this.lastChange = now;
        this.goodSince = 0;
        this.times.length = 0;
        this.justDegraded = true;
      }
      return;
    }
    this.consecutiveSlow = 0;

    this.times.push(dtMs);
    if (this.times.length > PerfMonitor.WINDOW) this.times.shift();
    if (this.times.length < PerfMonitor.WINDOW) return;

    const sorted = [...this.times].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    this.fps = 1000 / median;

    if (now - this.lastChange < PerfMonitor.COOLDOWN_MS) return;

    if (median > PerfMonitor.SLOW_MS && this.degrade > PerfMonitor.FLOOR) {
      const overrun = median / PerfMonitor.SLOW_MS;
      const factor = overrun > 2.5 ? 0.7 : 0.85;
      this.degrade = Math.max(PerfMonitor.FLOOR, this.degrade * factor);
      this.lastChange = now;
      this.goodSince = 0;
      this.times.length = 0;
      this.justDegraded = true;
    } else if (median < PerfMonitor.FAST_MS && this.degrade < ceiling) {
      if (this.goodSince === 0) this.goodSince = now;
      else if (now - this.goodSince > PerfMonitor.RECOVER_AFTER_MS) {
        this.degrade = Math.min(1, this.degrade * 1.3);
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
