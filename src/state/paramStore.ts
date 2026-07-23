import type { ParamState, ParamValue } from './types';

type Listener = () => void;

/**
 * Mutable single source of truth, deliberately outside Preact.
 * - The engine reads `store.state` directly every frame (no events, no allocation).
 * - UI controls subscribe per param path; a slider drag re-renders only that slider.
 * - Structure changes (scene switch, effect toggles, palette, snapshot loads) use
 *   the coarse channel; those happen at human speed, so a panel re-render is fine.
 */
class ParamStore {
  state!: ParamState;
  private keyListeners = new Map<string, Set<Listener>>();
  private structureListeners = new Set<Listener>();

  init(s: ParamState): void {
    this.state = s;
  }

  get(path: string): ParamValue | undefined {
    return this.state.params[path];
  }

  set(path: string, value: ParamValue): void {
    if (this.state.params[path] === value) return;
    this.state.params[path] = value;
    const ls = this.keyListeners.get(path);
    if (ls) for (const fn of ls) fn();
  }

  subscribe(path: string, fn: Listener): () => void {
    let set = this.keyListeners.get(path);
    if (!set) {
      set = new Set();
      this.keyListeners.set(path, set);
    }
    set.add(fn);
    return () => {
      set!.delete(fn);
      if (set!.size === 0) this.keyListeners.delete(path);
    };
  }

  subscribeStructure(fn: Listener): () => void {
    this.structureListeners.add(fn);
    return () => this.structureListeners.delete(fn);
  }

  /** Notify listeners of an arbitrary pseudo-path (e.g. "macro.speed"). */
  notify(path: string): void {
    const ls = this.keyListeners.get(path);
    if (ls) for (const fn of ls) fn();
  }

  /** High-frequency macro updates bypass the coarse structure channel. */
  setMacro(id: keyof ParamState['macros'], v: number): void {
    this.state.macros[id] = v;
    this.notify(`macro.${id}`);
  }

  setAudioAmount(v: number): void {
    this.state.audio.amount = v;
    this.notify('audio.amount');
  }

  /** Mutate non-param state (scene, effects, palette, macros, audio) + coarse notify. */
  mutate(fn: (s: ParamState) => void): void {
    fn(this.state);
    this.notifyStructure();
  }

  /** Replace the whole state (presets, URL load, surprise). Notifies everything. */
  applySnapshot(s: ParamState): void {
    this.state = s;
    this.notifyStructure();
    for (const set of this.keyListeners.values()) for (const fn of set) fn();
  }

  /**
   * Apply someone else's LOOK — a built-in preset or an imported share code — while
   * keeping the viewer's own performance settings. Those three keys are local-only
   * (never travel in a share code, never set by a preset), so a plain applySnapshot
   * would reset them to 100% / 100% / auto-off and slam a weak phone to full
   * resolution mid-party. Surprise Me already preserves them; this does the same for
   * presets and imports.
   */
  applyLook(s: ParamState): void {
    for (const key of ['global.quality', 'global.detail', 'global.autoquality'] as const) {
      if (this.state.params[key] !== undefined) s.params[key] = this.state.params[key];
    }
    this.applySnapshot(s);
  }

  private notifyStructure(): void {
    for (const fn of this.structureListeners) fn();
  }
}

export const store = new ParamStore();
