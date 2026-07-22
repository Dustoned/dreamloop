export type ParamValue = number | boolean | string;

interface ParamBase {
  /** Stable key; uniform name is `u_${id}`. */
  id: string;
  /** English display label. */
  label: string;
}

export interface SliderParam extends ParamBase {
  type: 'slider';
  min: number;
  max: number;
  step?: number;
  default: number;
  /** 'exp' makes the UI slider position map exponentially (for scale/frequency params). */
  curve?: 'linear' | 'exp';
  /** Display suffix, e.g. '%' or '×'. */
  unit?: string;
  /** Tasteful sub-range for the Surprise Me generator; omit to keep the default. */
  surprise?: [number, number];
}

export interface ColorParam extends ParamBase {
  type: 'color';
  default: string; // '#rrggbb'
}

export interface ToggleParam extends ParamBase {
  type: 'toggle';
  default: boolean;
  surprise?: boolean;
}

export interface SelectParam extends ParamBase {
  type: 'select';
  options: { value: number; label: string }[];
  default: number;
  surprise?: boolean;
}

export type ParamDef = SliderParam | ColorParam | ToggleParam | SelectParam;

export interface EffectDef {
  id: string;
  /** English display name, e.g. "Liquid Marble". */
  name: string;
  kind: 'scene' | 'post';
  /** Emoji used in pickers until real icons exist. */
  icon: string;
  /** Fragment shader body (no #version; standard prelude is injected). */
  frag: string;
  params: ParamDef[];
  /** Rough GPU cost: 1 cheap, 2 medium, 3 heavy. Drives auto-degrade & mobile defaults. */
  cost: 1 | 2 | 3;
  /** Multi-pass orchestration; everything but bloom and the RD sim is 'single'. */
  passes?: 'single' | 'bloom' | 'sim';
}

export type AudioMapping = 'bassPulse' | 'beatFlash' | 'trebleSparkle';

export type AudioBand = 'bass' | 'mid' | 'treble' | 'beat';

/** Per-slider audio link: effective = base + amt * band * (max - min). */
export interface ParamMod {
  src: AudioBand;
  amt: number;
}

/**
 * The single source of truth. UI edits it, the engine reads it every frame,
 * presets snapshot it, the URL codec compresses it, localStorage persists it.
 * Param paths are flat strings: "scene.<sceneId>.<paramId>", "fx.<fxId>.<paramId>",
 * "global.<paramId>".
 */
export interface ParamState {
  v: 1;
  scene: string;
  params: Record<string, ParamValue>;
  /** Sliders linked to the music, keyed by the same flat param path. */
  mods: Record<string, ParamMod>;
  effects: { id: string; on: boolean }[];
  palette: { preset: string | null; stops: string[] };
  macros: { speed: number; intensity: number; complexity: number; zoom: number; warp: number };
  audio: { amount: number; mappings: AudioMapping[] };
}

/** Live audio analysis, written by the analyser, read by the engine each frame. */
export interface AudioFrame {
  bass: number;
  mid: number;
  treble: number;
  /** Impulse: jumps to 1 on a detected beat, decays over ~250 ms. */
  beat: number;
}
