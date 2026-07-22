import { useState } from 'preact/hooks';
import { effectById } from '../../effects';
import { store } from '../../state/paramStore';
import { Section } from '../Section';
import { QuickEffects } from '../QuickEffects';
import { AutoControl } from '../controls/AutoControl';
import { useStructure } from '../hooks/useParam';

function EffectCard({ id }: { id: string }) {
  const def = effectById(id);
  useStructure();
  const [open, setOpen] = useState(false);
  if (!def) return null;
  const on = store.state.effects.find((e) => e.id === id)?.on ?? false;
  const toggle = (): void =>
    store.mutate((s) => {
      const e = s.effects.find((x) => x.id === id);
      if (e) e.on = !e.on;
    });

  return (
    <div class={`effect-card ${on ? 'on' : ''}`}>
      {/* Expanding is separate from switching on, so a stack of active effects
          stays short instead of dumping every parameter at once. */}
      <div class="effect-head">
        <button class="effect-expand" onClick={() => setOpen(!open)} title="Show settings">
          {open ? '▾' : '▸'}
        </button>
        <span class="effect-icon">{def.icon}</span>
        <span class="effect-name" onClick={() => setOpen(!open)}>
          {def.name}
        </span>
        <span class={`switch ${on ? 'on' : ''}`} onClick={toggle} title="Switch on or off">
          <span class="switch-knob" />
        </span>
      </div>
      {open && (
        <div class="effect-params">
          {def.params.map((p) => (
            <AutoControl key={p.id} path={`fx.${id}.${p.id}`} def={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export function EffectsTab({ advanced }: { advanced: boolean }) {
  useStructure();
  if (!advanced) {
    return (
      <Section title="Tap to switch on">
        <QuickEffects />
        <p class="tab-note">
          Switch to Advanced in the header to tune each effect&rsquo;s own settings.
        </p>
      </Section>
    );
  }
  return (
    <Section title="Effect stack">
      {store.state.effects.map((e) => (
        <EffectCard key={e.id} id={e.id} />
      ))}
    </Section>
  );
}
