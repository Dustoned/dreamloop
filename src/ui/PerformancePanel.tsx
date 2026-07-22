import { useEffect, useState } from 'preact/hooks';
import { perfMonitor } from '../engine/perf';
import { GLOBAL_PARAMS } from '../effects';
import { store } from '../state/paramStore';
import { AutoControl } from './controls/AutoControl';
import { useParam } from './hooks/useParam';

const PRESETS = [
  { label: 'Low', quality: 0.5, detail: 0.5 },
  { label: 'Medium', quality: 0.75, detail: 0.75 },
  { label: 'High', quality: 1, detail: 1 },
  { label: 'Ultra', quality: 1.5, detail: 1 },
];

const param = (id: string) => GLOBAL_PARAMS.find((p) => p.id === id);

/** Presets are just shortcuts that write the same values you can set by hand. */
function apply(p: (typeof PRESETS)[number]): void {
  perfMonitor.restore();
  store.set('global.quality', p.quality);
  store.set('global.detail', p.detail);
}

export function PerformancePanel() {
  const quality = (useParam('global.quality') as number) ?? 1;
  const detail = (useParam('global.detail') as number) ?? 1;
  const auto = (useParam('global.autoquality') as boolean) ?? false;
  const [live, setLive] = useState({ fps: 60, degrade: 1 });

  useEffect(() => {
    const t = setInterval(
      () => setLive({ fps: perfMonitor.fps, degrade: perfMonitor.degrade }),
      500,
    );
    return () => clearInterval(t);
  }, []);

  const held = auto && live.degrade < 0.98;
  const effective = Math.round(quality * (auto ? live.degrade : 1) * 100);
  const fps = Math.round(live.fps);

  const qParam = param('quality');
  const dParam = param('detail');
  const aParam = param('autoquality');

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
            class={
              Math.abs(quality - p.quality) < 0.03 && Math.abs(detail - p.detail) < 0.03
                ? 'active'
                : ''
            }
            onClick={() => apply(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {qParam && <AutoControl path="global.quality" def={qParam} />}
      {dParam && <AutoControl path="global.detail" def={dParam} />}
      {aParam && <AutoControl path="global.autoquality" def={aParam} />}

      {held && (
        <button class="wide-btn restore-btn" onClick={() => perfMonitor.restore()}>
          ↑ Back to full sharpness
        </button>
      )}

      <p class="perf-note">
        {auto
          ? held
            ? 'Auto-lower has stepped the resolution down because frames were dropping. Tap above to undo it, or switch auto off to stay where you put it.'
            : 'Auto-lower is on: if frames start dropping, the resolution steps down on its own.'
          : 'Nothing adjusts itself — these settings are exactly what you get. Resolution above 100% renders sharper than your screen; Shader Detail controls how much work the visuals do.'}
      </p>
    </div>
  );
}
