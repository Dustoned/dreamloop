import { buildDefaultState } from './defaults';
import { store } from './paramStore';
import { effectById } from '../effects';
import { showToast } from '../ui/Toast';

/**
 * Getting back to a known-good starting point.
 *
 * Every edit is autosaved, which is what you want right up until you have nudged
 * fifteen sliders, lost track of which one ruined it, and have no way back. There
 * was no reset of any kind in the app, so the only escape was clearing the site
 * data by hand.
 *
 * Each of these takes a snapshot first and hands it to the toast, so a reset is
 * itself undoable — the same treatment Surprise Me already gets.
 */

function snapshot(): ReturnType<typeof structuredClone<typeof store.state>> {
  return structuredClone(store.state);
}

function undoable(message: string, before: typeof store.state): void {
  showToast(message, { label: 'Undo', fn: () => store.applySnapshot(before) });
}

/** Put one effect's own controls back to their defaults, leaving everything else. */
export function resetEffect(id: string): void {
  const def = effectById(id);
  if (!def) return;
  const before = snapshot();
  const prefix = def.kind === 'scene' ? `scene.${id}.` : `fx.${id}.`;
  store.mutate((s) => {
    for (const p of def.params) {
      s.params[prefix + p.id] = p.default;
      // A music link on a control you have just reset is almost never wanted.
      delete s.mods[prefix + p.id];
    }
  });
  undoable(`${def.name} back to defaults`, before);
}

/** Brightness, contrast, colour, speed — the sliders that apply to every scene. */
export function resetGlobals(): void {
  const before = snapshot();
  const fresh = buildDefaultState();
  store.mutate((s) => {
    for (const key of Object.keys(s.params)) {
      if (key.startsWith('global.')) s.params[key] = fresh.params[key];
    }
    s.macros = { ...fresh.macros };
  });
  undoable('Image and feel back to defaults', before);
}

/** Factory state: every scene, every effect, palette, macros and audio. */
export function resetEverything(): void {
  const before = snapshot();
  const fresh = buildDefaultState();
  // Keep the user on the scene they are looking at; resetting the picture in front
  // of them AND jumping somewhere else at once is disorienting.
  fresh.scene = store.state.scene;
  store.applySnapshot(fresh);
  undoable('Everything back to defaults', before);
}
