import { PALETTES } from '../palette/palettes';
import { paletteCss } from '../palette/gradientTexture';
import { store } from '../state/paramStore';
import { useStructure } from './hooks/useParam';

export function PalettePicker({ compact = false }: { compact?: boolean }) {
  useStructure();
  const pal = store.state.palette;

  const pick = (id: string, stops: string[]) => {
    store.mutate((s) => {
      s.palette.preset = id;
      s.palette.stops = [...stops];
    });
  };

  const setStop = (i: number, hex: string) => {
    store.mutate((s) => {
      s.palette.stops[i] = hex;
      s.palette.preset = null;
    });
  };

  const addStop = () => {
    if (pal.stops.length >= 4) return;
    store.mutate((s) => {
      s.palette.stops.push('#ffffff');
      s.palette.preset = null;
    });
  };

  const removeStop = (i: number) => {
    if (pal.stops.length <= 2) return;
    store.mutate((s) => {
      s.palette.stops.splice(i, 1);
      s.palette.preset = null;
    });
  };

  return (
    <div class="palette-picker">
      <div class="palette-chips">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            class={`palette-chip ${pal.preset === p.id ? 'active' : ''}`}
            style={{ background: paletteCss(p.stops) }}
            title={p.name}
            onClick={() => pick(p.id, p.stops)}
          />
        ))}
      </div>
      {!compact && (
      <div class="palette-custom">
        <div class="palette-preview" style={{ background: paletteCss(pal.stops) }} />
        <div class="palette-stops">
          {pal.stops.map((stop, i) => (
            <span class="palette-stop" key={i}>
              <input
                type="color"
                value={stop}
                onInput={(e) => setStop(i, (e.currentTarget as HTMLInputElement).value)}
              />
              {pal.stops.length > 2 && (
                <button class="stop-remove" title="Remove color" onClick={() => removeStop(i)}>
                  ×
                </button>
              )}
            </span>
          ))}
          {pal.stops.length < 4 && (
            <button class="stop-add" title="Add color" onClick={addStop}>
              +
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
