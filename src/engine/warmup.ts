import type { Engine } from './engine';
import { EFFECTS, effectById } from '../effects';

let engineRef: Engine | null = null;

export function registerEngine(e: Engine): void {
  engineRef = e;
}

/** Begin linking one effect's shader now, without blocking. Safe to call often. */
export function warmEffect(id: string): void {
  const def = effectById(id);
  if (engineRef && def) engineRef.warm(def);
}

/**
 * Link every remaining shader during idle time, cheapest first and one per slice.
 * Without this, the first click on each scene pays the full link cost — which on a
 * weak driver is the multi-second freeze users actually notice.
 */
export function startIdleWarmup(): void {
  const queue = [...EFFECTS].sort((a, b) => a.cost - b.cost);
  const idle: (cb: () => void) => void =
    'requestIdleCallback' in window
      ? (cb) => (window as unknown as { requestIdleCallback: (c: () => void) => void }).requestIdleCallback(cb)
      : (cb) => void setTimeout(cb, 300);

  const step = (): void => {
    const def = queue.shift();
    if (!def || !engineRef) return;
    engineRef.warm(def);
    idle(step);
  };
  idle(step);
}
