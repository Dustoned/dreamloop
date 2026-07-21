import { useEffect, useReducer, useState } from 'preact/hooks';
import { audio } from '../audio/audioEngine';
import { store } from '../state/paramStore';
import type { AudioMapping } from '../state/types';
import { useStructure } from './hooks/useParam';

function useAudio(): void {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => audio.subscribe(() => force()), []);
}

/** Three tiny bars + a beat dot — live proof that the audio is being heard. */
export function LevelMeter() {
  const [levels, setLevels] = useState({ bass: 0, mid: 0, treble: 0, beat: 0 });
  useEffect(() => {
    const t = setInterval(() => {
      const f = audio.frame;
      setLevels({ bass: f.bass, mid: f.mid, treble: f.treble, beat: f.beat });
    }, 80);
    return () => clearInterval(t);
  }, []);
  return (
    <span class="level-meter" title="Bass / Mid / Treble">
      <span class="lvl" style={{ height: `${4 + levels.bass * 14}px` }} />
      <span class="lvl" style={{ height: `${4 + levels.mid * 14}px` }} />
      <span class="lvl" style={{ height: `${4 + levels.treble * 14}px` }} />
      <span class={`beat-dot ${levels.beat > 0.5 ? 'hit' : ''}`} />
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
  ];
  return (
    <div class="mapping-chips">
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

export function AudioPanel({ compact = false }: { compact?: boolean }) {
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
    <div class={`audio-panel ${compact ? 'compact' : ''}`}>
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

      {!compact && <MappingChips />}
      {compact && active === 'none' && (
        <div class="audio-hint">Let the visuals dance to your music</div>
      )}
    </div>
  );
}
