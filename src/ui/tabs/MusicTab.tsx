import { T } from '../../i18n/en';
import { Section } from '../Section';
import { AudioPanel } from '../AudioPanel';
import { AudioAmountSlider } from '../MacroSlider';
import { applyReactionPreset } from '../../state/reactionPresets';

export function MusicTab() {
  return (
    <>
      <Section title="Source">
        <AudioPanel />
      </Section>

      <Section title="Reaction">
        <AudioAmountSlider label={T.audioReact} />
        <div class="mapping-chips reaction-presets">
          <button class="chip" onClick={() => applyReactionPreset('drums')} title="Link this scene's controls to the kick and bassline">
            🥁 Drums
          </button>
          <button class="chip" onClick={() => applyReactionPreset('melody')} title="Link this scene's controls to the mids — vocals and leads">
            🎹 Melody
          </button>
          <button class="chip" onClick={() => applyReactionPreset('sparkle')} title="Link this scene's controls to the hats and shimmer">
            ✨ Sparkle
          </button>
          <button class="chip" onClick={() => applyReactionPreset('clear')} title="Remove this scene's music links">
            ✕ Clear
          </button>
        </div>
        <p class="tab-note">
          One tap links the current scene's best controls to that part of the music. Fine-tune
          (or roll your own) with the ♪ button next to any slider.
        </p>
      </Section>
    </>
  );
}
