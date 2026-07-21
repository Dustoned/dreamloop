import { useEffect, useReducer, useRef } from 'preact/hooks';
import { store } from '../state/paramStore';
import { applyMacro } from '../state/macros';
import type { ParamState } from '../state/types';

function useNotifyPath(path: string): void {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => store.subscribe(path, () => force()), [path]);
}

function Track({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const setFromClient = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    onChange(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };
  return (
    <div class="ctl slider macro">
      <div class="ctl-row">
        <span class="ctl-label">{label}</span>
        <span class="ctl-value">{Math.round(value * 100)}%</span>
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
        <div class="slider-fill" style={{ width: `${value * 100}%` }} />
        <div class="slider-thumb" style={{ left: `${value * 100}%` }} />
      </div>
    </div>
  );
}

export function MacroSlider({ id, label }: { id: keyof ParamState['macros']; label: string }) {
  useNotifyPath(`macro.${id}`);
  return <Track value={store.state.macros[id]} onChange={(v) => applyMacro(id, v)} label={label} />;
}

export function AudioAmountSlider({ label }: { label: string }) {
  useNotifyPath('audio.amount');
  return (
    <Track value={store.state.audio.amount} onChange={(v) => store.setAudioAmount(v)} label={label} />
  );
}
