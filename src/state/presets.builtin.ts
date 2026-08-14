import { DEFAULT_EFFECT_ORDER } from '../effects';

export interface BuiltinPreset {
  id: string;
  name: string;
  icon: string;
  /** Partial ParamState, hydrated against current defaults on load. */
  state: Record<string, unknown>;
}

/** Full effect list with the given ids switched on (order preserved). */
function fx(on: Record<string, boolean>): { id: string; on: boolean }[] {
  return DEFAULT_EFFECT_ORDER.map((id) => ({
    id,
    on: on[id] ?? (id === 'finish' ? true : false),
  }));
}

export const BUILTIN_PRESETS: BuiltinPreset[] = [
  {
    id: 'neon-waves',
    name: 'Neon Waves',
    icon: '🌊',
    state: {
      scene: 'plasma',
      palette: { preset: 'neon', stops: ['#0a0014', '#ff00cc', '#00ffee', '#faff00'] },
      effects: fx({ echo: true, glow: true }),
      params: { 'fx.glow.bintensity': 0.6 },
    },
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    icon: '🪐',
    state: {
      scene: 'stars',
      palette: { preset: 'ice', stops: ['#eaf8ff', '#8fd8ff', '#2a6fd8', '#0a2560'] },
      effects: fx({ echo: true, glow: true }),
      params: {
        'global.speed': 0.9,
        'scene.stars.fly': 1.3,
        'fx.echo.persist': 0.82,
        'fx.echo.fzoom': 0.5,
        'fx.echo.fblend': 1,
        'fx.glow.bintensity': 1,
      },
    },
  },
  {
    id: 'lava-lamp',
    name: 'Lava Lamp',
    icon: '🫠',
    state: {
      scene: 'plasma',
      palette: { preset: 'fire', stops: ['#0d0000', '#8f0f00', '#ff6a00', '#ffe08a'] },
      effects: fx({ echo: true }),
      params: {
        'global.speed': 0.45,
        'scene.plasma.scale': 0.7,
        'scene.plasma.waves': 3,
        'scene.plasma.wiggle': 0.5,
        'scene.plasma.soft': 0.85,
        'fx.echo.persist': 0.85,
        'fx.echo.fzoom': 0.12,
        'fx.echo.fspin': 0.05,
      },
    },
  },
  {
    id: 'kaleido-dream',
    name: 'Kaleido Dream',
    icon: '🪞',
    state: {
      scene: 'marble',
      palette: { preset: 'candy', stops: ['#ffd1e8', '#b8f2d9', '#d9c8ff', '#ffe9b8'] },
      effects: fx({ echo: true, kaleido: true }),
      params: {
        'global.speed': 0.8,
        'fx.kaleido.ksegments': 8,
        'fx.echo.persist': 0.6,
        'fx.echo.fspin': 0.25,
      },
    },
  },
  {
    id: 'ocean-flow',
    name: 'Ocean Flow',
    icon: '🌊',
    state: {
      scene: 'marble',
      palette: { preset: 'ocean', stops: ['#001b3a', '#0077b6', '#00d4d8', '#caf0f8'] },
      effects: fx({ echo: true }),
      params: {
        'global.speed': 0.6,
        'scene.marble.swirl': 2.1,
        'scene.marble.flow': 1,
        'fx.echo.persist': 0.55,
      },
    },
  },
  {
    id: 'electric-storm',
    name: 'Electric Storm',
    icon: '⚡',
    state: {
      scene: 'interference',
      palette: { preset: 'neon', stops: ['#0a0014', '#ff00cc', '#00ffee', '#faff00'] },
      effects: fx({ echo: true, prism: true }),
      params: {
        'global.speed': 1.5,
        'scene.interference.freq': 12,
        'scene.interference.sources': 5,
        'fx.prism.pstrength': 0.55,
        'fx.echo.fblend': 1,
        'fx.echo.persist': 0.75,
      },
    },
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    icon: '☀️',
    state: {
      scene: 'tunnel',
      palette: { preset: 'fire', stops: ['#0d0000', '#8f0f00', '#ff6a00', '#ffe08a'] },
      effects: fx({ echo: true, glow: true }),
      params: {
        'scene.tunnel.pattern': 1,
        'scene.tunnel.fog': 0.8,
        'scene.tunnel.flyspeed': 1.1,
        'fx.glow.bintensity': 1.2,
      },
    },
  },
  {
    id: 'fractal-bloom',
    name: 'Fractal Bloom',
    icon: '🌀',
    state: {
      scene: 'kali',
      palette: { preset: 'sunset', stops: ['#2d1b69', '#e91e8c', '#ff6b35', '#ffd23f'] },
      effects: fx({ echo: true, glow: true }),
      params: {
        'scene.kali.journey': 0.5,
        'fx.glow.bintensity': 0.9,
        'fx.echo.persist': 0.5,
      },
    },
  },
  {
    id: 'retro-disco',
    name: 'Retro Disco',
    icon: '🕺',
    state: {
      scene: 'tunnel',
      palette: { preset: 'rainbow', stops: ['#ff0040', '#ffe000', '#00e572', '#0080ff'] },
      effects: fx({ echo: true, pixelate: true, poster: true }),
      params: {
        'scene.tunnel.pattern': 2,
        'scene.tunnel.repeat': 10,
        'fx.pixelate.psize': 7,
        'fx.poster.levels': 6,
        'fx.echo.persist': 0.4,
      },
    },
  },
  {
    id: 'wormhole-ride',
    name: 'Wormhole Ride',
    icon: '🌪️',
    state: {
      scene: 'wormhole',
      palette: { preset: 'neon', stops: ['#0a0014', '#ff00cc', '#00ffee', '#faff00'] },
      effects: fx({ echo: true, glow: true }),
      params: {
        'scene.wormhole.wfly': 1.3,
        'scene.wormhole.worganic': 0.7,
        'fx.echo.persist': 0.6,
        'fx.echo.fzoom': 0.5,
        'fx.glow.bintensity': 0.9,
      },
    },
  },
  {
    id: 'hyperspace',
    name: 'Hyperspace',
    icon: '💠',
    state: {
      scene: 'fractalcore',
      palette: { preset: 'ice', stops: ['#eaf8ff', '#8fd8ff', '#2a6fd8', '#0a2560'] },
      effects: fx({ echo: true, prism: true }),
      params: {
        'scene.fractalcore.ffly': 0.9,
        'scene.fractalcore.fwarp': 0.6,
        'fx.prism.pstrength': 0.4,
        'fx.echo.persist': 0.55,
        'fx.echo.fblend': 1,
      },
    },
  },
  {
    id: 'deep-nebula',
    name: 'Deep Nebula',
    icon: '🌌',
    state: {
      scene: 'nebula',
      palette: { preset: 'sunset', stops: ['#2d1b69', '#e91e8c', '#ff6b35', '#ffd23f'] },
      effects: fx({ echo: true, glow: true }),
      params: {
        'global.speed': 0.8,
        'scene.nebula.ndensity': 1.1,
        'fx.glow.bintensity': 0.7,
        'fx.echo.persist': 0.5,
      },
    },
  },
  {
    id: 'mandel-dive',
    name: 'Mandel Dive',
    icon: '🔍',
    state: {
      scene: 'mandelzoom',
      palette: { preset: 'sunset', stops: ['#2d1b69', '#e91e8c', '#ff6b35', '#ffd23f'] },
      effects: fx({ glow: true }),
      params: {
        'scene.mandelzoom.zmode': 2,
        'scene.mandelzoom.zspeed': 0.6,
        'scene.mandelzoom.trapmix': 0.4,
        'scene.mandelzoom.iters': 240,
        'fx.glow.bintensity': 0.6,
        'global.colorspread': 1.6,
      },
    },
  },
  {
    id: 'endless-box',
    name: 'Endless Box',
    icon: '📦',
    state: {
      scene: 'infinitybox',
      palette: { preset: 'toxic', stops: ['#050a02', '#7dff00', '#eaff70', '#1a3a00'] },
      effects: fx({ echo: true, glow: true }),
      params: {
        'scene.infinitybox.mzoom': 0.9,
        'scene.infinitybox.mtwist': 0.3,
        'fx.echo.persist': 0.45,
        'fx.glow.bintensity': 0.8,
      },
    },
  },
  {
    id: 'bubble-cathedral',
    name: 'Bubble Cathedral',
    icon: '⭕',
    state: {
      scene: 'apollonian',
      palette: { preset: 'candy', stops: ['#ffd1e8', '#b8f2d9', '#d9c8ff', '#ffe9b8'] },
      effects: fx({ echo: true, glow: true }),
      params: {
        'scene.apollonian.ascale': 1.5,
        'scene.apollonian.azoom': 0.7,
        'fx.glow.bintensity': 0.9,
        'fx.echo.persist': 0.4,
      },
    },
  },
  {
    id: 'neon-julia',
    name: 'Neon Julia',
    icon: '🫧',
    state: {
      scene: 'juliamorph',
      palette: { preset: 'neon', stops: ['#0a0014', '#ff00cc', '#00ffee', '#faff00'] },
      effects: fx({ glow: true, prism: true }),
      params: {
        'scene.juliamorph.jmorph': 0.7,
        'scene.juliamorph.jglow': 0.8,
        'fx.glow.bintensity': 1,
        'fx.prism.pstrength': 0.3,
      },
    },
  },
  {
    id: 'alien-bulb',
    name: 'Alien Bulb',
    icon: '🧿',
    state: {
      scene: 'mandelbulb',
      palette: { preset: 'aurora', stops: ['#02102a', '#00c896', '#7a3fe0', '#8ef0d2'] },
      effects: fx({ glow: true }),
      params: {
        'scene.mandelbulb.bmorph': 0.5,
        'scene.mandelbulb.bdist': 1.9,
        'fx.glow.bintensity': 1.1,
      },
    },
  },
  {
    id: 'aurora-sky',
    name: 'Aurora',
    icon: '🌠',
    state: {
      scene: 'mandala',
      palette: { preset: 'aurora', stops: ['#02102a', '#00c896', '#7a3fe0', '#8ef0d2'] },
      effects: fx({ echo: true, rainbow: true }),
      params: {
        'global.speed': 0.55,
        'scene.mandala.suck': 0.5,
        'scene.mandala.segments': 10,
        'fx.rainbow.cyclespeed': 0.3,
        'fx.echo.persist': 0.8,
      },
    },
  },
  {
    id: 'ember-spirit',
    name: 'Ember Spirit',
    icon: '🔥',
    state: {
      scene: 'flame',
      palette: { preset: 'fire', stops: ['#0d0000', '#8f0f00', '#ff6a00', '#ffe08a'] },
      effects: fx({ glow: true }),
      params: {
        'scene.flame.fvar': 4,
        'scene.flame.fsym': 4,
        'scene.flame.fspread': 0.65,
        'scene.flame.ftwist': 0.35,
        'scene.flame.fmorph': 0.6,
        'scene.flame.fspin': 0.2,
        'scene.flame.fzoom': 1.1,
        'scene.flame.fbright': 0.65,
        'scene.flame.ftrail': 0.6,
        'scene.flame.fdensity': 1.1,
        'fx.glow.bthreshold': 0.4,
        'fx.glow.bintensity': 0.9,
      },
    },
  },
  {
    id: 'newtons-garden',
    name: "Newton's Garden",
    icon: '🌀',
    state: {
      scene: 'newton',
      palette: { preset: 'candy', stops: ['#ffd1e8', '#b8f2d9', '#d9c8ff', '#ffe9b8'] },
      effects: fx({ warp: true, glow: true }),
      params: {
        'scene.newton.nk': 6,
        'scene.newton.nrelax': 1.2,
        'scene.newton.naspin': 0.45,
        'scene.newton.nnova': 0.5,
        'scene.newton.nzoom': 1.2,
        'scene.newton.nspin': 0.15,
        'scene.newton.nglow': 0.7,
        'scene.newton.niters': 40,
        'fx.warp.wmode': 0,
        'fx.warp.wamount': 0.35,
        'fx.warp.wsize': 1.3,
        'fx.warp.wflow': 0.7,
        'fx.glow.bintensity': 0.7,
      },
    },
  },
  {
    id: 'infinite-descent',
    name: 'Infinite Descent',
    icon: '♾️',
    state: {
      scene: 'mandelzoom',
      palette: { preset: 'aurora', stops: ['#02102a', '#00c896', '#7a3fe0', '#8ef0d2'] },
      effects: fx({ glow: true }),
      params: {
        'scene.mandelzoom.engine': 1,
        'scene.mandelzoom.zmode': 0,
        'scene.mandelzoom.zspeed': 0.8,
        'scene.mandelzoom.iters': 300,
        'scene.mandelzoom.trapmix': 0.5,
        'scene.mandelzoom.trapshape': 2,
        'scene.mandelzoom.stripes': 0.5,
        'scene.mandelzoom.relief': 0.6,
        'global.colorspread': 1.8,
        'global.colorspeed': 0.15,
        'fx.glow.bintensity': 0.6,
      },
    },
  },
  {
    id: 'molten-temple',
    name: 'Molten Temple',
    icon: '💧',
    state: {
      scene: 'geometry',
      palette: { preset: 'sunset', stops: ['#2d1b69', '#e91e8c', '#ff6b35', '#ffd23f'] },
      effects: fx({ echo: true, warp: true, glow: true }),
      params: {
        'global.speed': 0.8,
        'scene.geometry.gpattern': 0,
        'scene.geometry.thick': 0.03,
        'scene.geometry.grot': 0.2,
        'scene.geometry.gpulse': 0.6,
        'scene.geometry.gdensity': 2.2,
        'fx.warp.wmode': 0,
        'fx.warp.wamount': 0.65,
        'fx.warp.wsize': 1.6,
        'fx.warp.wflow': 0.9,
        'fx.echo.persist': 0.55,
        'fx.echo.fspin': 0.1,
        'fx.glow.bintensity': 0.6,
      },
    },
  },
  {
    id: 'rainbow-slipstream',
    name: 'Rainbow Slipstream',
    icon: '🌈',
    state: {
      scene: 'stars',
      palette: { preset: 'blacklight', stops: ['#05000f', '#3a00ff', '#c400ff', '#00ffa2'] },
      effects: fx({ echo: true, glow: true }),
      params: {
        'scene.stars.fly': 1.8,
        'scene.stars.streak': 0.85,
        'scene.stars.density': 1.1,
        'scene.stars.layers': 6,
        'fx.echo.persist': 0.6,
        'fx.echo.fblend': 1,
        'fx.echo.fzoom': 0.25,
        'fx.echo.fhue': 0.6,
        'fx.glow.bintensity': 0.8,
      },
    },
  },
];
