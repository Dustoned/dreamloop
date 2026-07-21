import type { SelectParam } from '../../state/types';
import { store } from '../../state/paramStore';
import { useParam } from '../hooks/useParam';

export function SegmentedSelect({ path, def }: { path: string; def: SelectParam }) {
  const raw = useParam(path);
  const value = typeof raw === 'number' ? raw : def.default;
  return (
    <div class="ctl">
      <div class="ctl-row">
        <span class="ctl-label">{def.label}</span>
      </div>
      <div class="segmented">
        {def.options.map((o) => (
          <button
            key={o.value}
            class={o.value === value ? 'active' : ''}
            onClick={() => store.set(path, o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
