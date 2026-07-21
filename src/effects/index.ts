import type { EffectDef, ParamDef } from '../state/types';
import commonGlsl from './shared/common.glsl?raw';
import plasmaFrag from './scenes/plasma.frag?raw';
import tunnelFrag from './scenes/tunnel.frag?raw';
import mandalaFrag from './scenes/mandala.frag?raw';
import marbleFrag from './scenes/marble.frag?raw';
import kaliFrag from './scenes/kali.frag?raw';
import interferenceFrag from './scenes/interference.frag?raw';
import starsFrag from './scenes/stars.frag?raw';
import geometryFrag from './scenes/geometry.frag?raw';
import cellsFrag from './scenes/cells.frag?raw';
import tissueSimFrag from './scenes/tissue_sim.frag?raw';
import tissueViewFrag from './scenes/tissue_view.frag?raw';
import wormholeFrag from './scenes/wormhole.frag?raw';
import fractalcoreFrag from './scenes/fractalcore.frag?raw';
import nebulaFrag from './scenes/nebula.frag?raw';
import echoFrag from './post/echo.frag?raw';
import huecycleFrag from './post/huecycle.frag?raw';
import finalFrag from './post/final.frag?raw';
import kaleidoFrag from './post/kaleido.frag?raw';
import prismFrag from './post/prism.frag?raw';
import pixelateFrag from './post/pixelate.frag?raw';
import posterizeFrag from './post/posterize.frag?raw';
import bloomBrightFrag from './post/bloom_bright.frag?raw';
import bloomBlurFrag from './post/bloom_blur.frag?raw';
import bloomCompFrag from './post/bloom_comp.frag?raw';

export const COMMON_GLSL = commonGlsl;
export const FINAL_FRAG = finalFrag;
export const BLOOM_BRIGHT_FRAG = bloomBrightFrag;
export const BLOOM_BLUR_FRAG = bloomBlurFrag;
export const TISSUE_SIM_FRAG = tissueSimFrag;

/** Global (non-effect) params, shown at the top of the panel. Paths: "global.<id>". */
export const GLOBAL_PARAMS: ParamDef[] = [
  {
    type: 'slider',
    id: 'speed',
    label: 'Speed',
    min: 0,
    max: 3,
    step: 0.01,
    default: 1,
    unit: '×',
    surprise: [0.5, 1.6],
  },
  { type: 'slider', id: 'quality', label: 'Quality', min: 0.25, max: 1, step: 0.05, default: 1 },
];

export const EFFECTS: EffectDef[] = [
  {
    id: 'plasma',
    name: 'Plasma Waves',
    kind: 'scene',
    icon: '🌊',
    frag: plasmaFrag,
    cost: 1,
    params: [
      {
        type: 'slider',
        id: 'scale',
        label: 'Scale',
        min: 0.3,
        max: 3,
        step: 0.01,
        default: 1,
        curve: 'exp',
        surprise: [0.5, 2],
      },
      { type: 'slider', id: 'waves', label: 'Waves', min: 2, max: 5, step: 1, default: 5, surprise: [3, 5] },
      { type: 'slider', id: 'wiggle', label: 'Wiggle', min: 0, max: 2, step: 0.01, default: 0.8, surprise: [0.2, 1.6] },
      { type: 'slider', id: 'soft', label: 'Softness', min: 0, max: 1, step: 0.01, default: 0.5 },
    ],
  },
  {
    id: 'tunnel',
    name: 'Infinite Tunnel',
    kind: 'scene',
    icon: '🕳️',
    frag: tunnelFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'flyspeed', label: 'Fly Speed', min: 0, max: 3, step: 0.01, default: 0.8, surprise: [0.3, 1.8] },
      { type: 'slider', id: 'twist', label: 'Twist', min: -1, max: 1, step: 0.01, default: 0.2, surprise: [-0.7, 0.7] },
      { type: 'slider', id: 'repeat', label: 'Pattern Repeat', min: 3, max: 16, step: 1, default: 8, surprise: [4, 12] },
      { type: 'slider', id: 'fog', label: 'Depth Fog', min: 0, max: 1, step: 0.01, default: 0.6 },
      {
        type: 'select',
        id: 'pattern',
        label: 'Walls',
        options: [
          { value: 0, label: 'Grid' },
          { value: 1, label: 'Organic' },
          { value: 2, label: 'Checker' },
        ],
        default: 0,
        surprise: true,
      },
    ],
  },
  {
    id: 'mandala',
    name: 'Mandala',
    kind: 'scene',
    icon: '🪷',
    frag: mandalaFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'segments', label: 'Segments', min: 3, max: 24, step: 1, default: 8, surprise: [5, 16] },
      { type: 'slider', id: 'rotspeed', label: 'Rotation', min: -1, max: 1, step: 0.01, default: 0.2, surprise: [-0.6, 0.6] },
      { type: 'slider', id: 'suck', label: 'Fly Through', min: -1, max: 1, step: 0.01, default: 0.5, surprise: [-0.9, 0.9] },
      { type: 'slider', id: 'detail', label: 'Detail', min: 1, max: 5, step: 1, default: 3, surprise: [2, 5] },
      { type: 'slider', id: 'mglow', label: 'Glow', min: 0, max: 1, step: 0.01, default: 0.5, surprise: [0.2, 0.9] },
    ],
  },
  {
    id: 'wormhole',
    name: 'Wormhole',
    kind: 'scene',
    icon: '🌪️',
    frag: wormholeFrag,
    cost: 3,
    params: [
      { type: 'slider', id: 'wfly', label: 'Fly Speed', min: 0, max: 3, step: 0.01, default: 1, surprise: [0.4, 2] },
      { type: 'slider', id: 'wradius', label: 'Width', min: 0.6, max: 2, step: 0.01, default: 1.1, surprise: [0.8, 1.6] },
      { type: 'slider', id: 'worganic', label: 'Organic Walls', min: 0, max: 1, step: 0.01, default: 0.55, surprise: [0.2, 1] },
      { type: 'slider', id: 'wglow', label: 'Haze', min: 0, max: 1, step: 0.01, default: 0.5, surprise: [0.2, 0.9] },
      { type: 'slider', id: 'wbank', label: 'Camera Roll', min: 0, max: 1, step: 0.01, default: 0.5 },
    ],
  },
  {
    id: 'fractalcore',
    name: 'Fractal Core',
    kind: 'scene',
    icon: '💠',
    frag: fractalcoreFrag,
    cost: 3,
    params: [
      { type: 'slider', id: 'ffly', label: 'Fly Speed', min: 0, max: 2, step: 0.01, default: 0.55, surprise: [0.2, 1.2] },
      { type: 'slider', id: 'ffold', label: 'Structure', min: 1.5, max: 2.5, step: 0.005, default: 1.9, surprise: [1.6, 2.3] },
      { type: 'slider', id: 'fwarp', label: 'Morph', min: 0, max: 1, step: 0.01, default: 0.45, surprise: [0.1, 0.9] },
      { type: 'slider', id: 'fglow', label: 'Energy Glow', min: 0, max: 1, step: 0.01, default: 0.6, surprise: [0.3, 1] },
      { type: 'slider', id: 'fiter2', label: 'Iterations', min: 4, max: 9, step: 1, default: 7, surprise: [5, 8] },
    ],
  },
  {
    id: 'nebula',
    name: 'Nebula',
    kind: 'scene',
    icon: '🌌',
    frag: nebulaFrag,
    cost: 3,
    params: [
      { type: 'slider', id: 'ndrift', label: 'Drift', min: 0, max: 2, step: 0.01, default: 0.6, surprise: [0.2, 1.3] },
      { type: 'slider', id: 'ndensity', label: 'Gas Density', min: 0.3, max: 1.5, step: 0.01, default: 0.8, surprise: [0.5, 1.3] },
      { type: 'slider', id: 'ndetail', label: 'Detail', min: 2, max: 5, step: 1, default: 4 },
      { type: 'slider', id: 'nstars', label: 'Stars', min: 0, max: 1, step: 0.01, default: 0.6 },
      { type: 'slider', id: 'ncontrast', label: 'Contrast', min: 0.5, max: 2, step: 0.01, default: 1.15 },
    ],
  },
  {
    id: 'marble',
    name: 'Liquid Marble',
    kind: 'scene',
    icon: '🫧',
    frag: marbleFrag,
    cost: 2,
    params: [
      { type: 'slider', id: 'mscale', label: 'Scale', min: 0.4, max: 3, step: 0.01, default: 1, curve: 'exp', surprise: [0.6, 2] },
      { type: 'slider', id: 'swirl', label: 'Swirl', min: 0, max: 3, step: 0.01, default: 1.6, surprise: [0.8, 2.6] },
      { type: 'slider', id: 'detail', label: 'Detail', min: 2, max: 6, step: 1, default: 4, surprise: [3, 5] },
      { type: 'slider', id: 'flow', label: 'Flow', min: 0, max: 2, step: 0.01, default: 0.6, surprise: [0.3, 1.5] },
      { type: 'slider', id: 'contrast', label: 'Contrast', min: 0.5, max: 2, step: 0.01, default: 1.2 },
    ],
  },
  {
    id: 'kali',
    name: 'Fractal Voyage',
    kind: 'scene',
    icon: '🌀',
    frag: kaliFrag,
    cost: 2,
    params: [
      { type: 'slider', id: 'iter', label: 'Iterations', min: 4, max: 16, step: 1, default: 9, surprise: [6, 13] },
      { type: 'slider', id: 'shapex', label: 'Shape X', min: 0.2, max: 1.2, step: 0.005, default: 0.6, surprise: [0.35, 1.05] },
      { type: 'slider', id: 'shapey', label: 'Shape Y', min: 0.2, max: 1.2, step: 0.005, default: 0.55, surprise: [0.35, 1.05] },
      { type: 'slider', id: 'kzoom', label: 'Zoom', min: 0.4, max: 3, step: 0.01, default: 1, curve: 'exp', surprise: [0.6, 2] },
      { type: 'slider', id: 'journey', label: 'Journey', min: 0, max: 1, step: 0.01, default: 0.35, surprise: [0.1, 0.8] },
    ],
  },
  {
    id: 'interference',
    name: 'Wave Interference',
    kind: 'scene',
    icon: '🌊',
    frag: interferenceFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'sources', label: 'Sources', min: 2, max: 8, step: 1, default: 4, surprise: [2, 6] },
      { type: 'slider', id: 'freq', label: 'Frequency', min: 2, max: 20, step: 0.1, default: 8, curve: 'exp', surprise: [4, 14] },
      { type: 'slider', id: 'wspeed', label: 'Wave Speed', min: 0, max: 3, step: 0.01, default: 1, surprise: [0.4, 2] },
      { type: 'slider', id: 'orbit', label: 'Source Motion', min: 0, max: 2, step: 0.01, default: 0.8, surprise: [0.2, 1.5] },
      { type: 'slider', id: 'wcontrast', label: 'Contrast', min: 0.5, max: 2, step: 0.01, default: 1 },
    ],
  },
  {
    id: 'stars',
    name: 'Stardust',
    kind: 'scene',
    icon: '✨',
    frag: starsFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'density', label: 'Density', min: 0.2, max: 1.5, step: 0.01, default: 0.7, surprise: [0.4, 1.2] },
      { type: 'slider', id: 'fly', label: 'Fly Speed', min: 0, max: 3, step: 0.01, default: 1, surprise: [0.3, 2] },
      { type: 'slider', id: 'twinkle', label: 'Twinkle', min: 0, max: 1, step: 0.01, default: 0.5 },
      { type: 'slider', id: 'layers', label: 'Layers', min: 3, max: 8, step: 1, default: 5 },
      { type: 'slider', id: 'starsize', label: 'Star Size', min: 0.5, max: 2, step: 0.01, default: 1, surprise: [0.7, 1.6] },
    ],
  },
  {
    id: 'geometry',
    name: 'Sacred Geometry',
    kind: 'scene',
    icon: '🔯',
    frag: geometryFrag,
    cost: 1,
    params: [
      {
        type: 'select',
        id: 'gpattern',
        label: 'Pattern',
        options: [
          { value: 0, label: 'Flower' },
          { value: 1, label: 'Hex Web' },
          { value: 2, label: 'Rings' },
        ],
        default: 0,
        surprise: true,
      },
      { type: 'slider', id: 'thick', label: 'Line Width', min: 0.005, max: 0.08, step: 0.001, default: 0.02, surprise: [0.008, 0.05] },
      { type: 'slider', id: 'grot', label: 'Rotation', min: -1, max: 1, step: 0.01, default: 0.15, surprise: [-0.6, 0.6] },
      { type: 'slider', id: 'gpulse', label: 'Pulse', min: 0, max: 1, step: 0.01, default: 0.4 },
      { type: 'slider', id: 'gdensity', label: 'Density', min: 1, max: 4, step: 0.01, default: 2, curve: 'exp', surprise: [1.2, 3] },
    ],
  },
  {
    id: 'cells',
    name: 'Organic Cells',
    kind: 'scene',
    icon: '🦠',
    frag: cellsFrag,
    cost: 2,
    params: [
      { type: 'slider', id: 'cellsize', label: 'Cell Size', min: 0.5, max: 3, step: 0.01, default: 1.2, curve: 'exp', surprise: [0.7, 2.2] },
      { type: 'slider', id: 'move', label: 'Motion', min: 0, max: 2, step: 0.01, default: 0.8, surprise: [0.3, 1.5] },
      { type: 'slider', id: 'edge', label: 'Membrane', min: 0, max: 0.3, step: 0.005, default: 0.08, surprise: [0.03, 0.2] },
      { type: 'slider', id: 'smoothk', label: 'Fluidity', min: 0.01, max: 0.3, step: 0.005, default: 0.1 },
      { type: 'slider', id: 'cpulse', label: 'Breathe', min: 0, max: 1, step: 0.01, default: 0.4 },
    ],
  },
  {
    id: 'tissue',
    name: 'Living Tissue',
    kind: 'scene',
    icon: '🧬',
    frag: tissueViewFrag,
    cost: 2,
    passes: 'sim',
    params: [
      { type: 'slider', id: 'feed', label: 'Feed', min: 0.02, max: 0.09, step: 0.001, default: 0.037, surprise: [0.028, 0.075] },
      { type: 'slider', id: 'kill', label: 'Decay', min: 0.045, max: 0.07, step: 0.0005, default: 0.06, surprise: [0.052, 0.066] },
      { type: 'slider', id: 'simspeed', label: 'Growth Speed', min: 1, max: 10, step: 1, default: 7 },
      { type: 'slider', id: 'tscale', label: 'Zoom', min: 0.5, max: 2, step: 0.01, default: 1, curve: 'exp' },
      { type: 'slider', id: 'relief', label: 'Relief', min: 0, max: 1, step: 0.01, default: 0.5 },
      { type: 'slider', id: 'stir', label: 'Stir', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
  },
  {
    id: 'echo',
    name: 'Echo & Trails',
    kind: 'post',
    icon: '💫',
    frag: echoFrag,
    cost: 1,
    params: [
      {
        type: 'slider',
        id: 'persist',
        label: 'Persistence',
        min: 0,
        max: 0.98,
        step: 0.01,
        default: 0.7,
        surprise: [0.4, 0.95],
      },
      { type: 'slider', id: 'fzoom', label: 'Zoom', min: -1, max: 1, step: 0.01, default: 0.35, surprise: [-0.6, 0.9] },
      { type: 'slider', id: 'fspin', label: 'Spin', min: -1, max: 1, step: 0.01, default: 0.15, surprise: [-0.7, 0.7] },
      { type: 'slider', id: 'driftx', label: 'Drift X', min: -1, max: 1, step: 0.01, default: 0 },
      { type: 'slider', id: 'drifty', label: 'Drift Y', min: -1, max: 1, step: 0.01, default: 0 },
      {
        type: 'select',
        id: 'fblend',
        label: 'Blend',
        options: [
          { value: 0, label: 'Smear' },
          { value: 1, label: 'Trails' },
        ],
        default: 0,
        surprise: true,
      },
    ],
  },
  {
    id: 'kaleido',
    name: 'Kaleidoscope',
    kind: 'post',
    icon: '🪞',
    frag: kaleidoFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'ksegments', label: 'Segments', min: 2, max: 16, step: 1, default: 6, surprise: [3, 12] },
      { type: 'slider', id: 'kangle', label: 'Angle', min: 0, max: 1, step: 0.01, default: 0 },
      {
        type: 'select',
        id: 'kmode',
        label: 'Mode',
        options: [
          { value: 0, label: 'Polar' },
          { value: 1, label: 'Quad' },
        ],
        default: 0,
        surprise: true,
      },
    ],
  },
  {
    id: 'pixelate',
    name: 'Pixelate',
    kind: 'post',
    icon: '🟪',
    frag: pixelateFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'psize', label: 'Block Size', min: 2, max: 64, step: 1, default: 10, curve: 'exp', surprise: [4, 32] },
      { type: 'slider', id: 'pgap', label: 'Cell Edges', min: 0, max: 1, step: 0.01, default: 0 },
    ],
  },
  {
    id: 'poster',
    name: 'Poster & Dither',
    kind: 'post',
    icon: '🖨️',
    frag: posterizeFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'levels', label: 'Levels', min: 2, max: 16, step: 1, default: 5, surprise: [3, 8] },
      { type: 'toggle', id: 'pdither', label: 'Dither', default: true },
      { type: 'slider', id: 'dscale', label: 'Dither Scale', min: 1, max: 4, step: 1, default: 2 },
    ],
  },
  {
    id: 'prism',
    name: 'Prism',
    kind: 'post',
    icon: '🔮',
    frag: prismFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'pstrength', label: 'Strength', min: 0, max: 1, step: 0.01, default: 0.35, surprise: [0.1, 0.8] },
      {
        type: 'select',
        id: 'pmode',
        label: 'Mode',
        options: [
          { value: 0, label: 'Radial' },
          { value: 1, label: 'Twist' },
        ],
        default: 0,
      },
    ],
  },
  {
    id: 'glow',
    name: 'Glow',
    kind: 'post',
    icon: '🌟',
    frag: bloomCompFrag,
    cost: 2,
    passes: 'bloom',
    params: [
      { type: 'slider', id: 'bthreshold', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.55 },
      { type: 'slider', id: 'bintensity', label: 'Intensity', min: 0, max: 2, step: 0.01, default: 0.8, surprise: [0.4, 1.4] },
      { type: 'slider', id: 'bradius', label: 'Radius', min: 0.5, max: 3, step: 0.01, default: 1.2 },
    ],
  },
  {
    id: 'rainbow',
    name: 'Rainbow Cycle',
    kind: 'post',
    icon: '🌈',
    frag: huecycleFrag,
    cost: 1,
    params: [
      {
        type: 'slider',
        id: 'cyclespeed',
        label: 'Cycle Speed',
        min: 0,
        max: 2,
        step: 0.01,
        default: 0.5,
        surprise: [0.2, 1.2],
      },
      { type: 'slider', id: 'sat', label: 'Saturation', min: 0, max: 2, step: 0.01, default: 1 },
    ],
  },
  {
    id: 'finish',
    name: 'Vignette & Grain',
    kind: 'post',
    icon: '🎞️',
    frag: finalFrag,
    cost: 1,
    params: [
      { type: 'slider', id: 'vig', label: 'Vignette', min: 0, max: 1, step: 0.01, default: 0.35 },
      { type: 'slider', id: 'vigsoft', label: 'Softness', min: 0, max: 1, step: 0.01, default: 0.5 },
      { type: 'slider', id: 'grain', label: 'Grain', min: 0, max: 0.3, step: 0.005, default: 0.05 },
    ],
  },
];

export const SCENES = EFFECTS.filter((e) => e.kind === 'scene');

/**
 * Post effects that run in the ping-pong chain, in default order. 'echo' and
 * 'finish' are orchestrated specially by the engine (feedback pass and final
 * blit) but still appear in the effect list UI.
 */
export const DEFAULT_EFFECT_ORDER = [
  'echo',
  'kaleido',
  'pixelate',
  'poster',
  'prism',
  'glow',
  'rainbow',
  'finish',
];
export const DEFAULT_EFFECTS_ON = new Set(['echo', 'finish']);

const byId = new Map(EFFECTS.map((e) => [e.id, e]));

export function effectById(id: string): EffectDef | undefined {
  return byId.get(id);
}
