import { store } from './paramStore';
import type { ParamState } from './types';

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

type Target = { path: string; map: (m: number) => number };

/** What "Complexity" means differs per scene; each scene declares its own mapping. */
const SCENE_COMPLEXITY: Record<string, Target[]> = {
  plasma: [
    { path: 'scene.plasma.waves', map: (m) => Math.round(lerp(2, 5, m)) },
    { path: 'scene.plasma.wiggle', map: (m) => lerp(0.1, 1.8, m) },
  ],
  tunnel: [
    { path: 'scene.tunnel.repeat', map: (m) => Math.round(lerp(3, 14, m)) },
    { path: 'scene.tunnel.twist', map: (m) => lerp(0, 0.8, m) },
  ],
  mandala: [
    { path: 'scene.mandala.segments', map: (m) => Math.round(lerp(4, 20, m)) },
    { path: 'scene.mandala.detail', map: (m) => Math.round(lerp(1, 5, m)) },
  ],
  marble: [
    { path: 'scene.marble.detail', map: (m) => Math.round(lerp(2, 6, m)) },
    { path: 'scene.marble.swirl', map: (m) => lerp(0.5, 2.6, m) },
  ],
  kali: [{ path: 'scene.kali.iter', map: (m) => Math.round(lerp(5, 14, m)) }],
  interference: [
    { path: 'scene.interference.sources', map: (m) => Math.round(lerp(2, 8, m)) },
    { path: 'scene.interference.freq', map: (m) => lerp(4, 16, m) },
  ],
  stars: [
    { path: 'scene.stars.density', map: (m) => lerp(0.3, 1.4, m) },
    { path: 'scene.stars.layers', map: (m) => Math.round(lerp(3, 8, m)) },
  ],
  geometry: [{ path: 'scene.geometry.gdensity', map: (m) => lerp(1.2, 3.5, m) }],
  cells: [
    { path: 'scene.cells.cellsize', map: (m) => lerp(2.4, 0.7, m) },
    { path: 'scene.cells.move', map: (m) => lerp(0.3, 1.6, m) },
  ],
  tissue: [
    { path: 'scene.tissue.feed', map: (m) => lerp(0.03, 0.075, m) },
    { path: 'scene.tissue.stir', map: (m) => lerp(0.1, 0.8, m) },
  ],
  wormhole: [
    { path: 'scene.wormhole.worganic', map: (m) => lerp(0.1, 1, m) },
    { path: 'scene.wormhole.wglow', map: (m) => lerp(0.2, 0.9, m) },
  ],
  fractalcore: [
    { path: 'scene.fractalcore.fiter2', map: (m) => Math.round(lerp(4, 9, m)) },
    { path: 'scene.fractalcore.fwarp', map: (m) => lerp(0.1, 0.9, m) },
  ],
  nebula: [
    { path: 'scene.nebula.ndetail', map: (m) => Math.round(lerp(2, 5, m)) },
    { path: 'scene.nebula.ndensity', map: (m) => lerp(0.5, 1.35, m) },
  ],
};

const INTENSITY: Target[] = [
  { path: 'fx.echo.persist', map: (m) => lerp(0.2, 0.93, m) },
  { path: 'fx.echo.fzoom', map: (m) => lerp(0.1, 0.6, m) },
  { path: 'fx.glow.bintensity', map: (m) => lerp(0.3, 1.5, m) },
  { path: 'fx.finish.grain', map: (m) => lerp(0.02, 0.1, m) },
];

/**
 * A macro is a multi-param setter: it writes its targets through the normal
 * store.set, so the engine and advanced controls see plain param values.
 * Conflict policy: last write wins (predictable and explainable).
 */
export function applyMacro(id: keyof ParamState['macros'], m: number): void {
  store.setMacro(id, m);
  let targets: Target[];
  if (id === 'speed') targets = [{ path: 'global.speed', map: (mm) => 0.15 + 2.1 * mm * mm }];
  else if (id === 'intensity') targets = INTENSITY;
  else targets = SCENE_COMPLEXITY[store.state.scene] ?? [];
  for (const t of targets) store.set(t.path, t.map(m));
}
