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
];
