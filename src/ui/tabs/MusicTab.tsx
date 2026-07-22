import { T } from '../../i18n/en';
import { Section } from '../Section';
import { AudioPanel } from '../AudioPanel';
import { AudioAmountSlider } from '../MacroSlider';

export function MusicTab({ advanced }: { advanced: boolean }) {
  return (
    <>
      <Section title="Source">
        <AudioPanel compact={!advanced} />
      </Section>

      <Section title="Reaction">
        <AudioAmountSlider label={T.audioReact} />
        <p class="tab-note">
          Every scene and effect already has its own response to the music. Use the ♪ button
          next to any slider to steer one yourself.
        </p>
      </Section>
    </>
  );
}
