import type { ComponentChildren } from 'preact';
import { useEffect, useReducer } from 'preact/hooks';
import { GLOBAL_PARAMS, effectById } from '../effects';
import { party } from '../party/partyMode';
import { store } from '../state/paramStore';
import { T } from '../i18n/en';
import { useStructure } from './hooks/useParam';
import { AutoControl } from './controls/AutoControl';
import { PalettePicker } from './PalettePicker';
import { ScenePicker } from './ScenePicker';
import { AudioPanel } from './AudioPanel';
import { AudioAmountSlider } from './MacroSlider';

export function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="panel-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function EffectCard({ id }: { id: string }) {
  const def = effectById(id);
  useStructure();
  if (!def) return null;
  const entry = store.state.effects.find((e) => e.id === id);
  const on = entry?.on ?? false;
  return (
    <div class={`effect-card ${on ? 'on' : ''}`}>
      <div
        class="effect-head"
        onClick={() =>
          store.mutate((s) => {
            const e = s.effects.find((x) => x.id === id);
            if (e) e.on = !e.on;
          })
        }
      >
        <span class="effect-icon">{def.icon}</span>
        <span class="effect-name">{def.name}</span>
        <span class={`switch ${on ? 'on' : ''}`}>
          <span class="switch-knob" />
        </span>
      </div>
      {on && (
        <div class="effect-params">
          {def.params.map((p) => (
            <AutoControl key={p.id} path={`fx.${id}.${p.id}`} def={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdvancedPanel() {
  useStructure();
  const st = store.state;
  const sceneDef = effectById(st.scene);

  return (
    <div class="advanced-panel">
      <Section title={T.scene}>
        <ScenePicker />
      </Section>

      <Section title={T.playback}>
        {GLOBAL_PARAMS.map((p) => (
          <AutoControl key={p.id} path={`global.${p.id}`} def={p} />
        ))}
      </Section>

      {sceneDef && (
        <Section title={`${sceneDef.name} ${T.settings}`}>
          {sceneDef.params.map((p) => (
            <AutoControl key={p.id} path={`scene.${sceneDef.id}.${p.id}`} def={p} />
          ))}
        </Section>
      )}

      <Section title={T.effects}>
        {st.effects.map((e) => (
          <EffectCard key={e.id} id={e.id} />
        ))}
      </Section>

      <Section title={T.colors}>
        <PalettePicker />
      </Section>

      <Section title="Audio">
        <AudioPanel />
        <AudioAmountSlider label={T.audioReact} />
      </Section>

      <Section title="Party Mode">
        <PartySettings />
      </Section>
    </div>
  );
}

function PartySettings() {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => party.subscribe(() => force()), []);
  const options = [
    { sec: 30, label: '30s' },
    { sec: 90, label: '90s' },
    { sec: 180, label: '3m' },
    { sec: 300, label: '5m' },
  ];
  return (
    <div>
      <div class="ctl-row">
        <span class="ctl-label">Switch every</span>
      </div>
      <div class="segmented">
        {options.map((o) => (
          <button
            key={o.sec}
            class={party.intervalSec === o.sec ? 'active' : ''}
            onClick={() => party.setInterval(o.sec)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <button class="surprise-btn party-start" onClick={() => party.start()}>
        🎉 Start Party Mode
      </button>
    </div>
  );
}
