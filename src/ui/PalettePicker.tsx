import { useState } from 'preact/hooks';
import { PALETTES } from '../palette/palettes';
import { paletteCss } from '../palette/gradientTexture';
import { store } from '../state/paramStore';
import {
  listUserPalettes,
  saveUserPalette,
  deleteUserPalette,
} from '../state/userPalettes';
import { useStructure } from './hooks/useParam';

/** HSL (h 0-360, s/l 0-1) to #rrggbb. */
function hslHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** A pleasant random palette: one hue family, dark-to-light ramp, a little jitter. */
function randomStops(): string[] {
  const baseHue = Math.random() * 360;
  const spread = 40 + Math.random() * 90;
  const n = 3 + Math.floor(Math.random() * 2); // 3 or 4 stops
  const stops: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const h = baseHue + (t - 0.5) * spread + (Math.random() - 0.5) * 24;
    const s = 0.6 + Math.random() * 0.4;
    const l = 0.1 + t * 0.72 + (Math.random() - 0.5) * 0.12; // dark -> light
    stops.push(hslHex(h, s, Math.max(0.06, Math.min(0.94, l))));
  }
  return stops;
}

export function PalettePicker() {
  useStructure();
  const [mine, setMine] = useState(listUserPalettes);
  const pal = store.state.palette;
  const refreshMine = () => setMine(listUserPalettes());

  const setStops = (stops: string[], preset: string | null = null) => {
    store.mutate((s) => {
      s.palette.stops = [...stops];
      s.palette.preset = preset;
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

  // Reverse and Rotate are pure data ops on the stops; the LUT wraps end-to-start,
  // so both instantly recolour every scene without touching a shader.
  const reverse = () => setStops([...pal.stops].reverse());
  const rotate = () => setStops([...pal.stops.slice(1), pal.stops[0]]);
  const randomise = () => setStops(randomStops());

  const save = () => {
    if (saveUserPalette(pal.stops)) refreshMine();
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
            onClick={() => setStops(p.stops, p.id)}
          />
        ))}
      </div>

      {mine.length > 0 && (
        <div class="palette-chips mine">
          {mine.map((p) => (
            <span key={p.id} class="palette-chip-wrap">
              <button
                class="palette-chip"
                style={{ background: paletteCss(p.stops) }}
                title="Your palette"
                onClick={() => setStops(p.stops)}
              />
              <button
                class="chip-del"
                title="Delete palette"
                onClick={() => {
                  deleteUserPalette(p.id);
                  refreshMine();
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

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

      <div class="palette-tools">
        <button class="chip" onClick={reverse} title="Flip the gradient">
          ⇄ Reverse
        </button>
        <button class="chip" onClick={rotate} title="Shift the colours along">
          ↻ Rotate
        </button>
        <button class="chip" onClick={randomise} title="A fresh random palette">
          🎲 Random
        </button>
        <button class="chip" onClick={save} title="Keep this palette">
          ★ Save
        </button>
      </div>
    </div>
  );
}
