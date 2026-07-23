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
  mandelzoom: [{ path: 'scene.mandelzoom.iters', map: (m) => Math.round(lerp(80, 400, m)) }],
  juliamorph: [{ path: 'scene.juliamorph.jiters', map: (m) => Math.round(lerp(48, 300, m)) }],
  mandelbulb: [{ path: 'scene.mandelbulb.biters', map: (m) => Math.round(lerp(4, 12, m)) }],
  infinitybox: [{ path: 'scene.infinitybox.miters', map: (m) => Math.round(lerp(3, 10, m)) }],
  apollonian: [{ path: 'scene.apollonian.aiters', map: (m) => Math.round(lerp(4, 12, m)) }],
  // The three music visualisers were missing from every macro map, so Complexity,
  // Zoom and Warp did nothing on the app's most reactive scenes.
  ribbons: [{ path: 'scene.ribbons.rbands', map: (m) => Math.round(lerp(2, 9, m)) }],
  bloomring: [{ path: 'scene.bloomring.bsegments', map: (m) => Math.round(lerp(3, 18, m)) }],
  pulsewave: [{ path: 'scene.pulsewave.pcount', map: (m) => Math.round(lerp(2, 10, m)) }],
};

/** Zoom / depth per scene — the "get closer" control. */
const SCENE_ZOOM: Record<string, Target[]> = {
  plasma: [{ path: 'scene.plasma.scale', map: (m) => lerp(2.6, 0.35, m) }],
  tunnel: [{ path: 'scene.tunnel.fog', map: (m) => lerp(0.95, 0.1, m) }],
  mandala: [{ path: 'scene.mandala.suck', map: (m) => lerp(-0.9, 0.9, m) }],
  marble: [{ path: 'scene.marble.mscale', map: (m) => lerp(2.8, 0.45, m) }],
  kali: [{ path: 'scene.kali.kzoom', map: (m) => lerp(0.45, 2.8, m) }],
  interference: [{ path: 'scene.interference.freq', map: (m) => lerp(18, 3, m) }],
  stars: [{ path: 'scene.stars.starsize', map: (m) => lerp(0.6, 1.9, m) }],
  geometry: [{ path: 'scene.geometry.gdensity', map: (m) => lerp(3.8, 1.1, m) }],
  cells: [{ path: 'scene.cells.cellsize', map: (m) => lerp(0.6, 2.8, m) }],
  tissue: [{ path: 'scene.tissue.tscale', map: (m) => lerp(0.55, 1.9, m) }],
  wormhole: [{ path: 'scene.wormhole.wradius', map: (m) => lerp(1.9, 0.65, m) }],
  fractalcore: [{ path: 'scene.fractalcore.ffold', map: (m) => lerp(1.55, 2.45, m) }],
  nebula: [{ path: 'scene.nebula.ndensity', map: (m) => lerp(0.35, 1.45, m) }],
  mandelzoom: [{ path: 'scene.mandelzoom.basezoom', map: (m) => lerp(0, 12, m) }],
  juliamorph: [{ path: 'scene.juliamorph.basezoom', map: (m) => lerp(-2, 8, m) }],
  mandelbulb: [{ path: 'scene.mandelbulb.bdist', map: (m) => lerp(3.8, 1.45, m) }],
  infinitybox: [{ path: 'scene.infinitybox.moffset', map: (m) => lerp(0.65, 1.55, m) }],
  apollonian: [{ path: 'scene.apollonian.ascale', map: (m) => lerp(1.15, 1.9, m) }],
  ribbons: [{ path: 'scene.ribbons.rwidth', map: (m) => lerp(0.4, 2.4, m) }],
  bloomring: [{ path: 'scene.bloomring.bpetal', map: (m) => lerp(0.2, 1.9, m) }],
  pulsewave: [{ path: 'scene.pulsewave.pthick', map: (m) => lerp(0.4, 2.8, m) }],
};

/** Warp / twist — the "bend reality" control. */
const SCENE_WARP: Record<string, Target[]> = {
  plasma: [{ path: 'scene.plasma.wiggle', map: (m) => lerp(0, 2, m) }],
  tunnel: [{ path: 'scene.tunnel.twist', map: (m) => lerp(-1, 1, m) }],
  mandala: [{ path: 'scene.mandala.rotspeed', map: (m) => lerp(-1, 1, m) }],
  marble: [{ path: 'scene.marble.swirl', map: (m) => lerp(0, 3, m) }],
  kali: [{ path: 'scene.kali.kspin', map: (m) => lerp(-1, 1, m) }],
  interference: [{ path: 'scene.interference.orbit', map: (m) => lerp(0, 2, m) }],
  stars: [{ path: 'scene.stars.twinkle', map: (m) => m }],
  geometry: [{ path: 'scene.geometry.grot', map: (m) => lerp(-1, 1, m) }],
  cells: [{ path: 'scene.cells.smoothk', map: (m) => lerp(0.01, 0.3, m) }],
  tissue: [{ path: 'scene.tissue.relief', map: (m) => m }],
  wormhole: [{ path: 'scene.wormhole.wbank', map: (m) => m }],
  fractalcore: [{ path: 'scene.fractalcore.fspin', map: (m) => lerp(-1, 1, m) }],
  nebula: [{ path: 'scene.nebula.ndrift', map: (m) => lerp(0, 2, m) }],
  mandelzoom: [{ path: 'scene.mandelzoom.spin', map: (m) => lerp(-1, 1, m) }],
  juliamorph: [{ path: 'scene.juliamorph.jmorph', map: (m) => lerp(0, 2, m) }],
  mandelbulb: [{ path: 'scene.mandelbulb.bmorph', map: (m) => m }],
  infinitybox: [{ path: 'scene.infinitybox.mtwist', map: (m) => lerp(-1, 1, m) }],
  apollonian: [{ path: 'scene.apollonian.aspin', map: (m) => lerp(-1, 1, m) }],
  ribbons: [{ path: 'scene.ribbons.rswing', map: (m) => lerp(0.2, 2.5, m) }],
  bloomring: [{ path: 'scene.bloomring.bspin2', map: (m) => lerp(-1, 1, m) }],
  pulsewave: [{ path: 'scene.pulsewave.pwarp', map: (m) => lerp(0, 2, m) }],
};

const INTENSITY: Target[] = [
  { path: 'fx.echo.persist', map: (m) => lerp(0.2, 0.93, m) },
  { path: 'fx.echo.fzoom', map: (m) => lerp(0.1, 0.6, m) },
  { path: 'fx.glow.bintensity', map: (m) => lerp(0.3, 1.5, m) },
  { path: 'fx.finish.grain', map: (m) => lerp(0.02, 0.1, m) },
  { path: 'global.contrast', map: (m) => lerp(0.85, 1.45, m) },
];

/**
 * A macro is a multi-param setter: it writes its targets through the normal
 * store.set, so the engine and advanced controls see plain param values.
 * Conflict policy: last write wins (predictable and explainable).
 */
export function applyMacro(id: keyof ParamState['macros'], m: number): void {
  store.setMacro(id, m);
  const scene = store.state.scene;
  let targets: Target[];
  switch (id) {
    case 'speed':
      targets = [{ path: 'global.speed', map: (mm) => 0.15 + 2.1 * mm * mm }];
      break;
    case 'intensity':
      targets = INTENSITY;
      break;
    case 'complexity':
      targets = SCENE_COMPLEXITY[scene] ?? [];
      break;
    case 'zoom':
      targets = SCENE_ZOOM[scene] ?? [];
      break;
    case 'warp':
      targets = SCENE_WARP[scene] ?? [];
      break;
  }
  for (const t of targets) store.set(t.path, t.map(m));
}
