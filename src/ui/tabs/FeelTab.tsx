import { GLOBAL_PARAMS, effectById } from '../../effects';
import { store } from '../../state/paramStore';
import { T } from '../../i18n/en';
import { Section } from '../Section';
import { MacroSlider } from '../MacroSlider';
import { AutoControl } from '../controls/AutoControl';
import { useStructure } from '../hooks/useParam';
import { resetEffect, resetGlobals } from '../../state/reset';

const IMAGE_PARAMS = ['brightness', 'contrast', 'saturation', 'hue', 'colorspeed', 'colorspread'];

export function FeelTab() {
  useStructure();
  const sceneDef = effectById(store.state.scene);

  return (
    <>
      <Section title="Quick feel" hint="a few sliders that move many things at once">
        <MacroSlider id="speed" label={T.speed} />
        <MacroSlider id="intensity" label={T.intensity} />
        <MacroSlider id="complexity" label={T.complexity} />
        <MacroSlider id="zoom" label={T.zoom} />
        <MacroSlider id="warp" label={T.warp} />
      </Section>

      {sceneDef && (
        <Section
          title={`${sceneDef.name} settings`}
          action={{
            label: 'Reset',
            title: `Put every ${sceneDef.name} control back to its default`,
            fn: () => resetEffect(sceneDef.id),
          }}
        >
          {sceneDef.params.map((p) => (
            <AutoControl key={p.id} path={`scene.${sceneDef.id}.${p.id}`} def={p} />
          ))}
        </Section>
      )}

      <Section
        title="Image"
        collapsible
        defaultOpen={false}
        hint="brightness, colour"
        action={{ label: 'Reset', title: 'Put the image sliders back', fn: resetGlobals }}
      >
        {GLOBAL_PARAMS.filter((p) => IMAGE_PARAMS.includes(p.id)).map((p) => (
          <AutoControl key={p.id} path={`global.${p.id}`} def={p} />
        ))}
      </Section>
    </>
  );
}
