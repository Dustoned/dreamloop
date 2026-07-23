import type { ParamDef, ParamState, ParamValue, AudioMapping, AudioBand } from './types';
import { EFFECTS, GLOBAL_PARAMS, DEFAULT_EFFECT_ORDER, DEFAULT_EFFECTS_ON, effectById } from '../effects';
import { paletteById, PALETTES } from '../palette/palettes';

function defaultFor(def: ParamDef): ParamValue {
  return def.default;
}

export function buildDefaultState(): ParamState {
  const params: Record<string, ParamValue> = {};
  for (const p of GLOBAL_PARAMS) params[`global.${p.id}`] = defaultFor(p);
  for (const e of EFFECTS) {
    const prefix = e.kind === 'scene' ? `scene.${e.id}.` : `fx.${e.id}.`;
    for (const p of e.params) params[prefix + p.id] = defaultFor(p);
  }
  return {
    v: 1,
    scene: 'plasma',
    params,
    mods: {},
    effects: DEFAULT_EFFECT_ORDER.map((id) => ({ id, on: DEFAULT_EFFECTS_ON.has(id) })),
    palette: { preset: 'neon', stops: [...paletteById('neon')!.stops] },
    macros: { speed: 0.5, intensity: 0.5, complexity: 0.5, zoom: 0.5, warp: 0.5 },
    audio: { amount: 0.6, mappings: ['bassPulse', 'beatFlash'] },
  };
}

function clampParam(def: ParamDef, v: ParamValue): ParamValue | undefined {
  switch (def.type) {
    case 'slider': {
      if (typeof v !== 'number' || !isFinite(v)) return undefined;
      return Math.min(def.max, Math.max(def.min, v));
    }
    case 'toggle':
      return typeof v === 'boolean' ? v : undefined;
    case 'select': {
      if (typeof v !== 'number') return undefined;
      return def.options.some((o) => o.value === v) ? v : undefined;
    }
    case 'color':
      return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined;
  }
}

function defForPath(path: string): ParamDef | undefined {
  const parts = path.split('.');
  if (parts[0] === 'global') return GLOBAL_PARAMS.find((p) => p.id === parts[1]);
  if (parts.length === 3) {
    const eff = effectById(parts[1]);
    return eff?.params.find((p) => p.id === parts[2]);
  }
  return undefined;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const MAPPINGS: AudioMapping[] = [
  'bassPulse',
  'beatFlash',
  'trebleSparkle',
  'midSway',
  'beatColour',
];
const BANDS: AudioBand[] = ['bass', 'mid', 'treble', 'beat'];

/**
 * Merge an untrusted partial snapshot (preset / URL code / localStorage) over
 * fresh defaults. Unknown keys are dropped, values clamped to the current spec,
 * so old codes keep working as the app evolves.
 */
export function hydrate(partial: unknown): ParamState {
  const s = buildDefaultState();
  if (!partial || typeof partial !== 'object') return s;
  const p = partial as Record<string, unknown>;

  if (typeof p.scene === 'string' && effectById(p.scene)?.kind === 'scene') s.scene = p.scene;

  if (p.params && typeof p.params === 'object') {
    for (const [path, v] of Object.entries(p.params as Record<string, unknown>)) {
      const def = defForPath(path);
      if (!def) continue;
      const clamped = clampParam(def, v as ParamValue);
      if (clamped !== undefined) s.params[path] = clamped;
    }
  }

  if (p.mods && typeof p.mods === 'object') {
    for (const [path, m] of Object.entries(p.mods as Record<string, unknown>)) {
      const def = defForPath(path);
      if (def?.type !== 'slider') continue;
      const mod = m as { src?: unknown; amt?: unknown };
      if (!BANDS.includes(mod?.src as AudioBand)) continue;
      if (typeof mod.amt !== 'number' || !isFinite(mod.amt)) continue;
      s.mods[path] = { src: mod.src as AudioBand, amt: Math.min(1, Math.max(-1, mod.amt)) };
    }
  }

  if (Array.isArray(p.effects)) {
    const seen = new Set<string>();
    const order: { id: string; on: boolean }[] = [];
    for (const e of p.effects as { id?: unknown; on?: unknown }[]) {
      if (typeof e?.id !== 'string' || seen.has(e.id)) continue;
      if (effectById(e.id)?.kind !== 'post') continue;
      seen.add(e.id);
      order.push({ id: e.id, on: e.on === true });
    }
    for (const id of DEFAULT_EFFECT_ORDER) {
      if (!seen.has(id)) order.push({ id, on: DEFAULT_EFFECTS_ON.has(id) });
    }
    if (order.length) s.effects = order;
  }

  const pal = p.palette as { preset?: unknown; stops?: unknown } | undefined;
  if (pal && typeof pal === 'object') {
    if (
      Array.isArray(pal.stops) &&
      pal.stops.length >= 2 &&
      pal.stops.length <= 4 &&
      pal.stops.every((x) => typeof x === 'string' && HEX.test(x))
    ) {
      s.palette.stops = [...(pal.stops as string[])];
      s.palette.preset =
        typeof pal.preset === 'string' && PALETTES.some((q) => q.id === pal.preset)
          ? (pal.preset as string)
          : null;
    }
  }

  const mac = p.macros as Record<string, unknown> | undefined;
  if (mac && typeof mac === 'object') {
    for (const k of ['speed', 'intensity', 'complexity', 'zoom', 'warp'] as const) {
      const v = mac[k];
      if (typeof v === 'number' && isFinite(v)) s.macros[k] = Math.min(1, Math.max(0, v));
    }
  }

  const aud = p.audio as { amount?: unknown; mappings?: unknown } | undefined;
  if (aud && typeof aud === 'object') {
    if (typeof aud.amount === 'number' && isFinite(aud.amount))
      s.audio.amount = Math.min(1, Math.max(0, aud.amount));
    if (Array.isArray(aud.mappings))
      s.audio.mappings = (aud.mappings as unknown[]).filter((m): m is AudioMapping =>
        MAPPINGS.includes(m as AudioMapping),
      );
  }

  return s;
}
