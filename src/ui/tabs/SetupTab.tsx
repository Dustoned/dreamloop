import { useEffect, useReducer } from 'preact/hooks';
import { party } from '../../party/partyMode';
import { Section } from '../Section';
import { PerformancePanel } from '../PerformancePanel';
import { DisplaySettings } from '../DisplaySettings';
import { resetEverything } from '../../state/reset';

const INTERVALS = [
  { sec: 30, label: '30s' },
  { sec: 90, label: '90s' },
  { sec: 180, label: '3m' },
  { sec: 300, label: '5m' },
];

function PartySettings() {
  const [, force] = useReducer<number, void>((c) => c + 1, 0);
  useEffect(() => party.subscribe(() => force()), []);
  return (
    <>
      <div class="ctl-row">
        <span class="ctl-label">Switch every</span>
      </div>
      <div class="segmented">
        {INTERVALS.map((o) => (
          <button
            key={o.sec}
            class={party.intervalSec === o.sec ? 'active' : ''}
            onClick={() => party.setInterval(o.sec)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <button class="wide-btn" onClick={() => party.start()}>
        🎉 Start Party Mode (P)
      </button>
    </>
  );
}

export function SetupTab() {
  return (
    <>
      <Section title="Performance">
        <PerformancePanel />
      </Section>

      <Section title="Controls" collapsible defaultOpen={false} hint="auto-hide, side">
        <DisplaySettings />
      </Section>

      <Section title="Party Mode" collapsible defaultOpen={false} hint="auto-shuffle">
        <PartySettings />
      </Section>
      <Section title="Start over" hint="everything back to how it shipped">
        <p class="tab-note">
          Puts every scene, every effect, the palette and the image sliders back to
          their defaults. You can undo it from the message that appears.
        </p>
        <button class="wide-btn" onClick={resetEverything}>
          ↺ Reset everything
        </button>
      </Section>

    </>
  );
}
