import type { EffectDef, ParamDef } from '../state/types';
import commonGlsl from './shared/common.glsl?raw';
import plasmaFrag from './scenes/plasma.frag?raw';
import tunnelFrag from './scenes/tunnel.frag?raw';
import mandalaFrag from './scenes/mandala.frag?raw';
import marbleFrag from './scenes/marble.frag?raw';
import kaliFrag from './scenes/kali.frag?raw';
import echoFrag from './post/echo.frag?raw';
import huecycleFrag from './post/huecycle.frag?raw';
import finalFrag from './post/final.frag?raw';

export const COMMON_GLSL = commonGlsl;
export const FINAL_FRAG = finalFrag;

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
      { type: 'slider', id: 'rotspeed', label: 'Rotation', min: -1, max: 1, step: 0.01, default: 0.15, surprise: [-0.5, 0.5] },
      { type: 'slider', id: 'suck', label: 'Pull', min: -1, max: 1, step: 0.01, default: 0.35, surprise: [-0.8, 0.8] },
      { type: 'slider', id: 'detail', label: 'Detail', min: 1, max: 5, step: 1, default: 3, surprise: [2, 5] },
      { type: 'slider', id: 'rings', label: 'Rings', min: 0, max: 1, step: 0.01, default: 0.5, surprise: [0, 1] },
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
export const DEFAULT_EFFECT_ORDER = ['echo', 'rainbow', 'finish'];
export const DEFAULT_EFFECTS_ON = new Set(['echo', 'finish']);

const byId = new Map(EFFECTS.map((e) => [e.id, e]));

export function effectById(id: string): EffectDef | undefined {
  return byId.get(id);
}
