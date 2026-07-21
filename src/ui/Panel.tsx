import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { GLOBAL_PARAMS, effectById } from '../effects';
import { store } from '../state/paramStore';
import { useStructure } from './hooks/useParam';
import { AutoControl } from './controls/AutoControl';
import { PalettePicker } from './PalettePicker';

function Section({ title, children }: { title: string; children: ComponentChildren }) {
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

export function Panel() {
  useStructure();
  const [collapsed, setCollapsed] = useState(false);
  const st = store.state;
  const sceneDef = effectById(st.scene);

  if (collapsed) {
    return (
      <button class="panel-pill" onClick={() => setCollapsed(false)} title="Open controls">
        ✨
      </button>
    );
  }

  return (
    <div class="panel">
      <header class="panel-header">
        <span class="panel-title">Dreamloop</span>
        <button class="panel-collapse" onClick={() => setCollapsed(true)} title="Collapse">
          ›
        </button>
      </header>

      <Section title="Playback">
        {GLOBAL_PARAMS.map((p) => (
          <AutoControl key={p.id} path={`global.${p.id}`} def={p} />
        ))}
      </Section>

      {sceneDef && (
        <Section title={`Scene — ${sceneDef.name}`}>
          {sceneDef.params.map((p) => (
            <AutoControl key={p.id} path={`scene.${sceneDef.id}.${p.id}`} def={p} />
          ))}
        </Section>
      )}

      <Section title="Effects">
        {st.effects.map((e) => (
          <EffectCard key={e.id} id={e.id} />
        ))}
      </Section>

      <Section title="Colors">
        <PalettePicker />
      </Section>
    </div>
  );
}
