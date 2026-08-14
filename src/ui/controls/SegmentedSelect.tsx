import type { SelectParam } from '../../state/types';
import { store } from '../../state/paramStore';
import { useParam } from '../hooks/useParam';

export function SegmentedSelect({ path, def }: { path: string; def: SelectParam }) {
  const raw = useParam(path);
  const value = typeof raw === 'number' ? raw : def.default;

  // Same dead-control honesty as sliders: dim it and say why, rather than leave
  // the user clicking options that change nothing in the current mode.
  const gate = def.activeWhen;
  const prefix = path.slice(0, path.lastIndexOf('.') + 1);
  const gateValue = useParam(gate ? prefix + gate.param : '');
  const andValue = useParam(gate?.andParam ? prefix + gate.andParam : '');
  const inactive =
    !!gate &&
    gateValue === gate.notEquals &&
    (gate.andParam === undefined || andValue === gate.andEquals);

  return (
    <div class={`ctl ${inactive ? 'ctl-inactive' : ''}`}>
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
      {inactive && <div class="ctl-note">No effect here — {gate!.because}.</div>}
    </div>
  );
}
