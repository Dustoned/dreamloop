import { T } from '../i18n/en';
import { requestPhoto } from '../capture/screenshot';
import { party } from '../party/partyMode';
import { MacroSlider, AudioAmountSlider } from './MacroSlider';
import { PalettePicker } from './PalettePicker';
import { ScenePicker } from './ScenePicker';
import { AudioPanel } from './AudioPanel';
import { PresetRow, saveCurrentPreset } from './PresetRow';
import { openShareDialog } from './ShareDialog';
import { doSurprise, toggleFullscreen } from './shortcuts';

export function SimplePanel() {
  return (
    <div class="simple-panel">
      <ScenePicker />
      <PresetRow />
      <div class="macro-group">
        <MacroSlider id="speed" label={T.speed} />
        <MacroSlider id="intensity" label={T.intensity} />
        <MacroSlider id="complexity" label={T.complexity} />
        <AudioAmountSlider label={T.audioReact} />
      </div>
      <AudioPanel compact />
      <PalettePicker compact />
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
