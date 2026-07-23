import { useState } from 'preact/hooks';
import { BUILTIN_PRESETS } from '../state/presets.builtin';
import { hydrate } from '../state/defaults';
import { store } from '../state/paramStore';
import {
  listUserPresets,
  saveUserPreset,
  deleteUserPreset,
  nextPresetName,
} from '../state/userPresets';
import { showToast } from './Toast';

export function saveCurrentPreset(): void {
  const name = nextPresetName();
  const p = saveUserPreset(name, store.state);
  if (p) showToast(`Saved as "${name}"`);
  else showToast('Preset limit reached (50) — delete a few first.');
  bumpUserPresets();
}

let bumpUserPresets: () => void = () => {};

export function PresetRow() {
  const [userList, setUserList] = useState(listUserPresets);
  bumpUserPresets = () => setUserList(listUserPresets());

  const apply = (state: unknown) => store.applyLook(hydrate(state));

  return (
    <div class="preset-row">
      {BUILTIN_PRESETS.map((p) => (
        <button key={p.id} class="preset-chip" onClick={() => apply(p.state)}>
          <span>{p.icon}</span> {p.name}
        </button>
      ))}
      {userList.map((p) => (
        <span key={p.id} class="preset-chip user">
          <button class="preset-load" onClick={() => apply(p.state)}>
            ⭐ {p.name}
          </button>
          <button
            class="preset-del"
            title="Delete"
            onClick={() => {
              deleteUserPreset(p.id);
              setUserList(listUserPresets());
            }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
