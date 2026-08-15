import { useEffect, useReducer, useState } from 'preact/hooks';
import { audio } from '../audio/audioEngine';
import { store } from '../state/paramStore';
import type { AudioMapping } from '../state/types';
import { useStructure } from './hooks/useParam';

function useAudio(): void {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => audio.subscribe(() => force()), []);
}

const METER_BANDS = ['sub', 'bass', 'lowmid', 'mid', 'highmid', 'treble', 'air'] as const;

/** Seven tiny bars (one per linkable tone, low to high) + a beat dot — live proof
 *  that the audio is being heard, and of which tones are alive right now. */
export function LevelMeter() {
  const [levels, setLevels] = useState<number[]>(() => METER_BANDS.map(() => 0));
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    let prev = '';
    const t = setInterval(() => {
      const f = audio.frame;
      // Round first and skip the update when nothing visibly moved, so a silent
      // track does not keep re-rendering the panel.
      const next = METER_BANDS.map((b) => Math.round(f[b] * 20) / 20);
      const nextBeat = f.beat > 0.5 ? 1 : 0;
      const key = next.join(',') + ',' + nextBeat;
      if (key === prev) return;
      prev = key;
      setLevels(next);
      setBeat(nextBeat);
    }, 80);
    return () => clearInterval(t);
  }, []);
  // scaleY stays on the compositor; animating height would dirty layout every tick.
  const bar = (v: number) => ({ transform: `scaleY(${0.2 + v * 0.8})` });
  return (
    <span class="level-meter" title="Sub / Bass / Low Mid / Mid / High Mid / Treble / Air">
      {levels.map((v, i) => (
        <span key={METER_BANDS[i]} class="lvl" style={bar(v)} />
      ))}
      <span class={`beat-dot ${beat ? 'hit' : ''}`} />
    </span>
  );
}

function MappingChips() {
  useStructure();
  const mappings = store.state.audio.mappings;
  const CHIPS: { id: AudioMapping; label: string }[] = [
    { id: 'bassPulse', label: 'Bass → pulse' },
    { id: 'beatFlash', label: 'Beat → flash' },
    { id: 'trebleSparkle', label: 'Treble → sparkle' },
    { id: 'midSway', label: 'Mid → sway' },
    { id: 'beatColour', label: 'Beat → colour' },
    { id: 'beatPunch', label: 'Beat → punch' },
    { id: 'bassWarp', label: 'Bass → warp' },
  ];
  // Inverted chip: active = 'sceneStill' NOT stored, so saves that predate the chip
  // keep their scenes reacting. Turning it off mutes every built-in scene reaction,
  // leaving only the accent chips and the user's own slider links — which makes each
  // one clearly audible on its own.
  const sceneMoves = !mappings.includes('sceneStill');
  return (
    <div class="mapping-chips">
      <button
        class={`chip ${sceneMoves ? 'active' : ''}`}
        title="The scene's own built-in reaction to the music"
        onClick={() =>
          store.mutate((s) => {
            s.audio.mappings = sceneMoves
              ? [...s.audio.mappings, 'sceneStill']
              : s.audio.mappings.filter((m) => m !== 'sceneStill');
          })
        }
      >
        Scene → moves
      </button>
      {CHIPS.map((c) => (
        <button
          key={c.id}
          class={`chip ${mappings.includes(c.id) ? 'active' : ''}`}
          onClick={() =>
            store.mutate((s) => {
              s.audio.mappings = s.audio.mappings.includes(c.id)
                ? s.audio.mappings.filter((m) => m !== c.id)
                : [...s.audio.mappings, c.id];
            })
          }
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export function AudioPanel() {
  useAudio();

  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) void audio.useFile(f);
    };
    input.click();
  };

  const active = audio.kind;

  return (
    <div class="audio-panel">
      <div class="audio-sources">
        <button class={`chip ${active === 'file' ? 'active' : ''}`} onClick={pickFile}>
          🎵 Music file
        </button>
        {audio.tabAudioSupported && (
          <button class={`chip ${active === 'tab' ? 'active' : ''}`} onClick={() => void audio.useTab()}>
            🖥️ Tab audio
          </button>
        )}
        <button class={`chip ${active === 'mic' ? 'active' : ''}`} onClick={() => void audio.useMic()}>
          🎤 Microphone
        </button>
        {active !== 'none' && (
          <button class="chip stop" onClick={() => audio.stop()}>
            ✕
          </button>
        )}
        {active !== 'none' && <LevelMeter />}
      </div>

      {audio.error && (
        <div class="audio-error">
          {audio.error}
        </div>
      )}

      {active === 'file' && audio.trackName && (
        <div class="audio-track">
          <button class="chip" onClick={() => audio.toggleFilePlayback()}>
            {audio.audioEl?.paused ? '▶' : '⏸'}
          </button>
          <span class="track-name">{audio.trackName}</span>
        </div>
      )}

      {active === 'none' && <div class="audio-hint">Let the visuals dance to your music</div>}
      <MappingChips />
    </div>
  );
}
