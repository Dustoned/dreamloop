import { effectById } from '../effects';
import { store } from '../state/paramStore';
import { useStructure } from './hooks/useParam';

/** One-tap effect toggles for Simple mode — no parameter clutter. */
export function QuickEffects() {
  useStructure();
  const effects = store.state.effects.filter((e) => e.id !== 'finish');
  return (
    <div class="quick-effects">
      {effects.map((e) => {
        const def = effectById(e.id);
        if (!def) return null;
        return (
          <button
            key={e.id}
            class={`chip ${e.on ? 'active' : ''}`}
            title={def.name}
            onClick={() =>
              store.mutate((s) => {
                const t = s.effects.find((x) => x.id === e.id);
                if (t) t.on = !t.on;
              })
            }
          >
            {def.icon} {def.name}
          </button>
        );
      })}
    </div>
  );
}
