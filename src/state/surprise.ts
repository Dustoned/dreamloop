import { buildDefaultState } from './defaults';
import { EFFECTS, GLOBAL_PARAMS, SCENES } from '../effects';
import { PALETTES } from '../palette/palettes';
import { store } from './paramStore';
import type { ParamDef, ParamState } from './types';

const rnd = Math.random;
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

function randomizeParams(s: ParamState, prefix: string, params: ParamDef[]): void {
  for (const p of params) {
    if (p.type === 'slider' && p.surprise) {
      let v = p.surprise[0] + rnd() * (p.surprise[1] - p.surprise[0]);
      if (p.step && p.step >= 1) v = Math.round(v);
      s.params[prefix + p.id] = v;
    } else if (p.type === 'select' && p.surprise) {
      s.params[prefix + p.id] = pick(p.options).value;
    }
  }
}

/**
 * Curated randomness: params only roam within their tasteful `surprise` ranges,
 * at most two extra post effects are enabled, and speed stays in the middle
 * band — a surprise should never nauseate.
 */
export function makeSurprise(): ParamState {
  const s = buildDefaultState();
  s.scene = pick(SCENES).id;
  const pal = pick(PALETTES.filter((p) => p.id !== 'mono'));
  s.palette = { preset: pal.id, stops: [...pal.stops] };

  for (const def of EFFECTS) {
    const prefix = def.kind === 'scene' ? `scene.${def.id}.` : `fx.${def.id}.`;
    randomizeParams(s, prefix, def.params);
  }
  randomizeParams(s, 'global.', GLOBAL_PARAMS);
  // Performance settings are the user's, not the dice's — keep all three, not just
  // Resolution. Surprising someone should never quietly turn Auto-quality back on
  // or reset Shader Detail.
  s.params['global.quality'] = store.state.params['global.quality'];
  s.params['global.detail'] = store.state.params['global.detail'];
  s.params['global.autoquality'] = store.state.params['global.autoquality'];

  const extras = ['kaleido', 'pixelate', 'poster', 'prism', 'glow', 'rainbow'].sort(
    () => rnd() - 0.5,
  );
  const chosen = new Set<string>();
  for (const id of extras) {
    if (chosen.size >= 2) break;
    if (rnd() < 0.4) chosen.add(id);
  }
  for (const e of s.effects) {
    if (e.id === 'echo') e.on = rnd() < 0.75;
    else if (e.id === 'finish') e.on = true;
    else e.on = chosen.has(e.id);
  }

  s.macros = {
    speed: 0.35 + rnd() * 0.3,
    intensity: 0.35 + rnd() * 0.4,
    complexity: 0.3 + rnd() * 0.5,
    zoom: 0.25 + rnd() * 0.5,
    warp: 0.2 + rnd() * 0.6,
  };
  s.audio = { ...store.state.audio, mappings: [...store.state.audio.mappings] };
  return s;
}

export function snapshotState(): ParamState {
  return JSON.parse(JSON.stringify(store.state)) as ParamState;
}
