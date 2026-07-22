import { useEffect, useState } from 'preact/hooks';
import { perfMonitor } from '../engine/perf';
import { store } from '../state/paramStore';
import { useParam } from './hooks/useParam';

const PRESETS = [
  { label: 'Low', quality: 0.4 },
  { label: 'Medium', quality: 0.7 },
  { label: 'High', quality: 1 },
];

/** Asking for a quality clears any penalty the monitor applied — the user wins. */
function setQuality(q: number): void {
  perfMonitor.restore();
  store.set('global.quality', q);
}

export function PerformancePanel() {
  const quality = (useParam('global.quality') as number) ?? 1;
  const [live, setLive] = useState({ fps: 60, degrade: 1 });

  useEffect(() => {
    const t = setInterval(
      () => setLive({ fps: perfMonitor.fps, degrade: perfMonitor.degrade }),
      500,
    );
    return () => clearInterval(t);
  }, []);

  const effective = Math.round(quality * live.degrade * 100);
  const fps = Math.round(live.fps);
  const held = live.degrade < 0.98;

  return (
    <div class="perf-panel">
      <div class="perf-stats">
        <span class={`perf-fps ${fps < 25 ? 'bad' : fps < 45 ? 'ok' : 'good'}`}>{fps} fps</span>
        <span class="perf-res">rendering at {effective}%</span>
      </div>

      <div class="segmented">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            class={Math.abs(quality - p.quality) < 0.03 ? 'active' : ''}
            onClick={() => setQuality(p.quality)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {held && (
        <button class="wide-btn restore-btn" onClick={() => perfMonitor.restore()}>
          ↑ Back to full sharpness
        </button>
      )}

      <p class="perf-note">
        {held
          ? 'Quality was turned down automatically because frames were dropping. Tap above to undo it.'
          : 'Running at the quality you chose. If it starts to stutter, this lowers itself and tells you.'}
      </p>
    </div>
  );
}
