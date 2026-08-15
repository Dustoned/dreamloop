import { effectById } from '../effects';
import { store } from './paramStore';
import { showToast } from '../ui/Toast';
import type { AudioBand } from './types';

export type ReactionPresetId = 'drums' | 'melody' | 'sparkle' | 'clear';

/** Which tones each preset listens to, in priority order. */
const BANDS: Record<Exclude<ReactionPresetId, 'clear'>, AudioBand[]> = {
  drums: ['sub', 'bass', 'beat'],
  melody: ['lowmid', 'mid', 'highmid'],
  sparkle: ['treble', 'air'],
};

/**
 * One-tap reaction styles for the CURRENT scene: turn its curated built-in audio
 * links into strong user links riding a chosen part of the music. Uses the same
 * per-scene (param, band) table the registry ships, so every preset picks controls
 * that genuinely suit the scene — Drums on a tunnel kicks the fly speed, Sparkle on
 * Stardust sizzles the twinkle. 'clear' removes the scene's links again.
 */
export function applyReactionPreset(kind: ReactionPresetId): void {
  const scene = store.state.scene;
  const def = effectById(scene);
  const prefix = `scene.${scene}.`;
  let linked = 0;

  store.mutate((s) => {
    for (const k of Object.keys(s.mods)) {
      if (k.startsWith(prefix)) delete s.mods[k];
    }
    if (kind === 'clear' || !def) return;

    const wanted = BANDS[kind];
    const table = def.audioReact ?? [];
    for (const r of table) {
      if (!wanted.includes(r.band)) continue;
      s.mods[prefix + r.id] = { src: r.band, amt: Math.sign(r.amount) * 0.7 };
      linked++;
    }
    // A scene whose table lacks these tones still deserves a response: put the
    // preset's leading tone on the scene's first reactive param.
    if (linked === 0 && table.length > 0) {
      s.mods[prefix + table[0].id] = { src: wanted[0], amt: 0.7 };
      linked = 1;
    }
  });

  if (kind === 'clear') showToast('Cleared this scene’s music links.');
  else if (linked === 0) showToast('This scene has no linkable reactions.');
  else {
    const label = { drums: 'the drums 🥁', melody: 'the melody 🎹', sparkle: 'the sparkle ✨' }[kind];
    showToast(`This scene now rides ${label} — see the glowing ♪ buttons.`);
  }
}
