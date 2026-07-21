import { useEffect, useReducer } from 'preact/hooks';
import { party } from '../party/partyMode';

export function PartyOverlay() {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => party.subscribe(() => force()), []);
  if (!party.active) return null;
  return (
    <div class="party-overlay" onClick={() => party.stop()}>
      <span class="party-exit-hint">🎉 Party mode — tap anywhere to exit</span>
    </div>
  );
}
