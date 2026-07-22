import { T } from '../i18n/en';
import { requestPhoto } from '../capture/screenshot';
import { party } from '../party/partyMode';
import { PALETTES } from '../palette/palettes';
import { store } from '../state/paramStore';
import { MacroSlider, AudioAmountSlider } from './MacroSlider';
import { PalettePicker } from './PalettePicker';
import { ScenePicker } from './ScenePicker';
import { AudioPanel } from './AudioPanel';
import { QuickEffects } from './QuickEffects';
import { PresetRow, saveCurrentPreset } from './PresetRow';
import { openShareDialog } from './ShareDialog';
import { doSurprise, toggleFullscreen } from './shortcuts';

function shuffleColours(): void {
  const pool = PALETTES.filter((p) => p.id !== store.state.palette.preset);
  const p = pool[Math.floor(Math.random() * pool.length)];
  store.mutate((s) => {
    s.palette.preset = p.id;
    s.palette.stops = [...p.stops];
  });
}

export function SimplePanel() {
  return (
    <div class="simple-panel">
      <ScenePicker />
      <PresetRow />

      <h4 class="mini-head">Feel</h4>
      <div class="macro-group">
        <MacroSlider id="speed" label={T.speed} />
        <MacroSlider id="intensity" label={T.intensity} />
        <MacroSlider id="complexity" label={T.complexity} />
        <MacroSlider id="zoom" label={T.zoom} />
        <MacroSlider id="warp" label={T.warp} />
      </div>

      <h4 class="mini-head">Effects</h4>
      <QuickEffects />

      <h4 class="mini-head">Colours</h4>
      <PalettePicker compact />
      <button class="wide-btn" onClick={shuffleColours}>
        🎨 {T.shuffleColours}
      </button>

      <h4 class="mini-head">Music</h4>
      <AudioPanel compact />
      <AudioAmountSlider label={T.audioReact} />

      <button class="surprise-btn" onClick={doSurprise}>
        ✨ {T.surpriseMe}
      </button>
      <div class="action-row">
        <button onClick={requestPhoto} title="Save a photo (S)">
          <span class="action-icon">📷</span>
          {T.photo}
        </button>
        <button onClick={openShareDialog} title="Share this look">
          <span class="action-icon">🔗</span>
          {T.share}
        </button>
        <button onClick={saveCurrentPreset} title="Save as preset">
          <span class="action-icon">⭐</span>
          {T.save}
        </button>
        <button onClick={() => party.start()} title="Party mode (P)">
          <span class="action-icon">🎉</span>
          {T.party}
        </button>
        <button onClick={toggleFullscreen} title="Fullscreen (F)">
          <span class="action-icon">⛶</span>
          {T.fullscreen}
        </button>
      </div>
    </div>
  );
}
