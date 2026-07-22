import { useEffect, useState } from 'preact/hooks';
import { perfMonitor } from '../engine/perf';
import { store } from '../state/paramStore';
import { useParam } from './hooks/useParam';

const PRESETS = [
  { label: 'Low', quality: 0.4 },
  { label: 'Medium', quality: 0.7 },
  { label: 'High', quality: 1 },
];

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
  const held = live.degrade < 0.99;

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
            onClick={() => store.set('global.quality', p.quality)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p class="perf-note">
        {held
          ? 'Your device is being given an easier time automatically. Pick Low above if it still stutters.'
          : 'Running at the quality you chose. If things stutter, the app lowers this by itself.'}
      </p>
    </div>
  );
}
