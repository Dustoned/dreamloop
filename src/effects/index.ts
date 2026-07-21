import type { EffectDef, ParamDef } from '../state/types';
import commonGlsl from './shared/common.glsl?raw';
import plasmaFrag from './scenes/plasma.frag?raw';
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
