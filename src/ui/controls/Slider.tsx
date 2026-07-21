import { useRef } from 'preact/hooks';
import type { SliderParam } from '../../state/types';
import { store } from '../../state/paramStore';
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

export function Slider({ path, def }: { path: string; def: SliderParam }) {
  const raw = useParam(path);
  const value = typeof raw === 'number' ? raw : def.default;
  const track = useRef<HTMLDivElement>(null);

  const setFromClient = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    store.set(path, fromT(def, (clientX - r.left) / r.width));
  };

  const nudge = (dir: number, big: boolean) => {
    store.set(path, fromT(def, toT(def, value) + dir * (big ? 0.1 : 0.02)));
  };

  return (
    <div
      class="ctl slider"
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
        <span class="ctl-value">{fmt(def, value)}</span>
      </div>
      <div
        class="slider-track"
        ref={track}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setFromClient(e.clientX);
        }}
        onPointerMove={(e) => {
          if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId))
            setFromClient(e.clientX);
        }}
      >
        <div class="slider-fill" style={{ width: `${toT(def, value) * 100}%` }} />
        <div class="slider-thumb" style={{ left: `${toT(def, value) * 100}%` }} />
      </div>
    </div>
  );
}
