import { useEffect, useReducer } from 'preact/hooks';
import { store } from '../../state/paramStore';
import type { ParamValue } from '../../state/types';

/** Subscribe to a single param path; only this component re-renders on change. */
export function useParam(path: string): ParamValue | undefined {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => store.subscribe(path, () => force()), [path]);
  return store.get(path);
}

/** Re-render on coarse structure changes (scene switch, effect toggles, palette, snapshots). */
export function useStructure(): void {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => store.subscribeStructure(() => force()), []);
}
