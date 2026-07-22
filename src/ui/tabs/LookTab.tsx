import { PALETTES } from '../../palette/palettes';
import { store } from '../../state/paramStore';
import { Section } from '../Section';
import { ScenePicker } from '../ScenePicker';
import { PalettePicker } from '../PalettePicker';
import { PresetRow } from '../PresetRow';

function shuffleColours(): void {
  const pool = PALETTES.filter((p) => p.id !== store.state.palette.preset);
  const p = pool[Math.floor(Math.random() * pool.length)];
  store.mutate((s) => {
    s.palette.preset = p.id;
    s.palette.stops = [...p.stops];
  });
}

export function LookTab({ advanced }: { advanced: boolean }) {
  return (
    <>
      <Section title="Scene">
        <ScenePicker />
      </Section>

      <Section title="Presets">
        <PresetRow />
      </Section>

      <Section title="Colours">
        <PalettePicker compact={!advanced} />
        <button class="wide-btn" onClick={shuffleColours}>
          🎨 Shuffle colours
        </button>
      </Section>
    </>
  );
}
