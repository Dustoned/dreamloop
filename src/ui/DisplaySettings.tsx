import { useEffect, useReducer } from 'preact/hooks';
import { uiPrefs, setUiPref, subscribeUi } from './uiPrefs';
import { Toggle } from './controls/Toggle';
import { togglePanel } from './shortcuts';

const DELAYS = [2, 3, 5, 10];

export function DisplaySettings() {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => subscribeUi(() => force()), []);

  return (
    <div class="display-settings">
      <Toggle
        label="Hide controls when idle"
        value={uiPrefs.autoHide}
        onChange={(v) => setUiPref('autoHide', v)}
      />

      {uiPrefs.autoHide && (
        <>
          <div class="ctl-row">
            <span class="ctl-label">Hide after</span>
          </div>
          <div class="segmented">
            {DELAYS.map((d) => (
              <button
                key={d}
                class={uiPrefs.hideDelay === d ? 'active' : ''}
                onClick={() => setUiPref('hideDelay', d)}
              >
                {d}s
              </button>
            ))}
          </div>
        </>
      )}

      <div class="ctl-row" style={{ marginTop: '12px' }}>
        <span class="ctl-label">Panel side</span>
      </div>
      <div class="segmented">
        <button
          class={uiPrefs.side === 'left' ? 'active' : ''}
          onClick={() => setUiPref('side', 'left')}
        >
          Left
        </button>
        <button
          class={uiPrefs.side === 'right' ? 'active' : ''}
          onClick={() => setUiPref('side', 'right')}
        >
          Right
        </button>
      </div>

      <button class="wide-btn" onClick={togglePanel}>
        🙈 Hide controls completely (H)
      </button>
    </div>
  );
}
