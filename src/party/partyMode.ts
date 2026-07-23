import { BUILTIN_PRESETS } from '../state/presets.builtin';
import { makeSurprise } from '../state/surprise';
import { hydrate } from '../state/defaults';
import { store } from '../state/paramStore';
import { audio } from '../audio/audioEngine';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Auto-shuffles between built-in presets and Surprise looks. When audio is
 * playing, the switch waits (up to 3s) for a detected beat so transitions land
 * on the music. A short luminance dip masks the hard cut.
 */
class PartyMode {
  active = false;
  intervalSec = 90;
  private timer: number | undefined;
  private pollTimer: number | undefined;
  private dipTimer: number | undefined;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    document.body.classList.add('party-active');
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    this.scheduleNext();
    this.emit();
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    document.body.classList.remove('party-active');
    clearTimeout(this.timer);
    clearTimeout(this.pollTimer);
    // The dip-and-swap is a separate timer; without cancelling it, exiting within
    // ~260 ms of a scheduled switch still swapped the look once after you left.
    clearTimeout(this.dipTimer);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    this.emit();
  }

  setInterval(sec: number): void {
    this.intervalSec = sec;
    if (this.active) {
      clearTimeout(this.timer);
      this.scheduleNext();
    }
    this.emit();
  }

  private scheduleNext(): void {
    this.timer = window.setTimeout(() => this.trigger(), this.intervalSec * 1000);
  }

  private trigger(): void {
    if (!this.active) return;
    if (audio.kind !== 'none') {
      // wait up to 3s for a beat so the switch lands on the music
      const deadline = performance.now() + 3000;
      const poll = () => {
        if (!this.active) return;
        if (audio.frame.beat > 0.9 || performance.now() > deadline) this.switchNow();
        else this.pollTimer = window.setTimeout(poll, 50);
      };
      poll();
    } else {
      this.switchNow();
    }
  }

  private switchNow(): void {
    const dip = document.getElementById('dip');
    dip?.classList.add('on');
    this.dipTimer = window.setTimeout(() => {
      if (!this.active) {
        dip?.classList.remove('on');
        return;
      }
      const usePreset = Math.random() < 0.5;
      if (usePreset) store.applySnapshot(hydrate(pick(BUILTIN_PRESETS).state));
      else store.applySnapshot(makeSurprise());
      dip?.classList.remove('on');
      this.scheduleNext();
    }, 260);
  }
}

export const party = new PartyMode();
