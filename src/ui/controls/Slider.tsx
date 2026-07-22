import { useRef, useState } from 'preact/hooks';
import type { AudioBand, SliderParam } from '../../state/types';
import { store } from '../../state/paramStore';
import { perfMonitor } from '../../engine/perf';
import { useParam } from '../hooks/useParam';

function toT(def: SliderParam, v: number): number {
  if (def.curve === 'exp' && def.min > 0) return Math.log(v / def.min) / Math.log(def.max / def.min);
  return (v - def.min) / (def.max - def.min);
}

function fromT(def: SliderParam, t: number): number {
  t = Math.min(1, Math.max(0, t));
  let v =
    def.curve === 'exp' && def.min > 0
      ? def.min * Math.pow(def.max / def.min, t)
      : def.min + (def.max - def.min) * t;
  if (def.step) v = Math.round(v / def.step) * def.step;
  return Math.min(def.max, Math.max(def.min, v));
}

function fmt(def: SliderParam, v: number): string {
  const step = def.step ?? 0.01;
  const dec = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  return v.toFixed(dec) + (def.unit ?? '');
}

const BANDS: { id: AudioBand; label: string }[] = [
  { id: 'bass', label: 'Bass' },
  { id: 'mid', label: 'Mid' },
  { id: 'treble', label: 'Treble' },
  { id: 'beat', label: 'Beat' },
];

function ModPopover({ path, onClose }: { path: string; onClose: () => void }) {
  const mod = store.state.mods[path];
  const [, force] = useState(0);
  const set = (next: { src: AudioBand; amt: number } | null) => {
    store.mutate((s) => {
      if (next) s.mods[path] = next;
      else delete s.mods[path];
    });
    force((n) => n + 1);
  };
  // Matches the cap the registry enforces on built-in reactions: half the
  // slider range on every beat is a lurch, not an accent.
  const cur = mod ?? { src: 'bass' as AudioBand, amt: 0.3 };
  return (
    <div class="mod-popover" onClick={(e) => e.stopPropagation()}>
      <div class="mod-row">
        {BANDS.map((b) => (
          <button
            key={b.id}
            class={`chip ${mod && mod.src === b.id ? 'active' : ''}`}
            onClick={() => set({ ...cur, src: b.id })}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div class="mod-amount">
        <span class="ctl-label">Amount</span>
        <input
          type="range"
          min="-100"
          max="100"
          value={String(Math.round(cur.amt * 100))}
          onInput={(e) =>
            set({ ...cur, amt: Number((e.currentTarget as HTMLInputElement).value) / 100 })
          }
        />
        <span class="ctl-value">{Math.round(cur.amt * 100)}%</span>
      </div>
      <div class="mod-row">
        <button class="chip" onClick={() => set(null)}>
          Unlink
        </button>
        <button class="chip" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

export function Slider({ path, def }: { path: string; def: SliderParam }) {
  const raw = useParam(path);
  const value = typeof raw === 'number' ? raw : def.default;
  const track = useRef<HTMLDivElement>(null);
  const [modOpen, setModOpen] = useState(false);
  const linked = !!store.state.mods[path];

  // Some sliders genuinely do nothing in certain modes (Zoom Speed while Motion
  // is on Hold). Say so instead of leaving the user dragging a dead control.
  const gate = def.activeWhen;
  const gatePath = gate ? path.slice(0, path.lastIndexOf('.') + 1) + gate.param : '';
  const gateValue = useParam(gatePath);
  const inactive = !!gate && gateValue === gate.notEquals;

  // The track cannot move during a pointer-captured drag, so measure it once on
  // press instead of forcing a layout on every pointermove.
  const rect = useRef<{ left: number; width: number } | null>(null);
  const setFromClient = (clientX: number) => {
    const r = rect.current ?? track.current!.getBoundingClientRect();
    const next = fromT(def, (clientX - r.left) / r.width);
    // Asking for a quality must also clear any automatic reduction, or the
    // slider appears to do nothing.
    if (path === 'global.quality') perfMonitor.restore();
    store.set(path, next);
  };

  const nudge = (dir: number, big: boolean) => {
    store.set(path, fromT(def, toT(def, value) + dir * (big ? 0.1 : 0.02)));
  };

  return (
    <div
      class={`ctl slider ${inactive ? 'ctl-inactive' : ''}`}
      tabIndex={0}
      onDblClick={() => store.set(path, def.default)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          nudge(1, e.shiftKey);
          e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          nudge(-1, e.shiftKey);
          e.preventDefault();
        }
      }}
    >
      <div class="ctl-row">
        <span class="ctl-label">{def.label}</span>
        <button
          class={`mod-btn ${linked ? 'linked' : ''}`}
          title={linked ? 'Reacts to the music' : 'Make this react to the music'}
          onClick={(e) => {
            e.stopPropagation();
            setModOpen(!modOpen);
          }}
        >
          ♪
        </button>
        <span class="ctl-value">{fmt(def, value)}</span>
      </div>
      {inactive && <div class="ctl-note">No effect here — {gate!.because}.</div>}
      {modOpen && <ModPopover path={path} onClose={() => setModOpen(false)} />}
      <div
        class="slider-track"
        ref={track}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          const r = track.current!.getBoundingClientRect();
          rect.current = { left: r.left, width: r.width };
          setFromClient(e.clientX);
        }}
        onPointerMove={(e) => {
          if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId))
            setFromClient(e.clientX);
        }}
        onPointerUp={() => {
          rect.current = null;
        }}
        onPointerCancel={() => {
          rect.current = null;
        }}
      >
        <div class="slider-fill" style={{ width: `${toT(def, value) * 100}%` }} />
        <div class="slider-thumb" style={{ left: `${toT(def, value) * 100}%` }} />
      </div>
    </div>
  );
}
