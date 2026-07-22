import { useState } from 'preact/hooks';
import { T } from '../i18n/en';
import { requestPhoto } from '../capture/screenshot';
import { party } from '../party/partyMode';
import { TABS, loadTab, saveTab, type TabId } from './tabs';
import { LookTab } from './tabs/LookTab';
import { FeelTab } from './tabs/FeelTab';
import { EffectsTab } from './tabs/EffectsTab';
import { MusicTab } from './tabs/MusicTab';
import { SetupTab } from './tabs/SetupTab';
import { saveCurrentPreset } from './PresetRow';
import { openShareDialog } from './ShareDialog';
import { doSurprise, toggleFullscreen } from './shortcuts';
import { useSheet, SNAPS } from './useSheet';

export function Panel() {
  const [tab, setTab] = useState<TabId>(loadTab);
  const [collapsed, setCollapsed] = useState(false);
  const sheet = useSheet();

  const pickTab = (id: TabId) => {
    setTab(id);
    saveTab(id);
  };

  if (collapsed) {
    return (
      <button class="panel-pill" onClick={() => setCollapsed(false)} title="Open controls">
        ✨
      </button>
    );
  }

  // On phones the sheet height is driven by the drag/snap state; on desktop the
  // panel sizes itself and must not get a height at all.
  //
  // This is set as a plain inline height rather than through a CSS custom
  // property. With `height: var(--sheet-h)` plus a height transition, changing
  // only the variable left the element at its old height — measured: tapping
  // from the 58vh snap to the 90vh snap did nothing at all, so the third snap
  // point silently didn't work. An inline length transitions correctly.
  const peeking = sheet.snap === 0 && sheet.dragVh === null;
  const sheetStyle =
    sheet.active && !peeking ? { height: `${sheet.dragVh ?? SNAPS[sheet.snap]}vh` } : undefined;

  return (
    <div class={`panel snap-${sheet.snap} ${sheet.dragVh !== null ? 'dragging' : ''}`} style={sheetStyle}>
      <div
        class="sheet-grip"
        title="Drag to resize, tap to cycle"
        onPointerDown={sheet.onPointerDown}
        onPointerMove={sheet.onPointerMove}
        onPointerUp={sheet.onPointerUp}
        onPointerCancel={sheet.onPointerUp}
      >
        <span class="sheet-handle" />
      </div>

      <header class="panel-header">
        <span class="panel-title">{T.appName}</span>
        <button
          class="panel-collapse"
          onClick={() => setCollapsed(true)}
          title="Hide the controls"
          aria-label="Hide the controls"
        >
          <span class="collapse-desktop">›</span>
          <span class="collapse-mobile">✕</span>
        </button>
      </header>

      <nav class="panel-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            class={tab === t.id ? 'active' : ''}
            onClick={() => pickTab(t.id)}
            title={t.label}
          >
            <span class="tab-icon">{t.icon}</span>
            <span class="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <div class="panel-body">
        {tab === 'look' && <LookTab />}
        {tab === 'feel' && <FeelTab />}
        {tab === 'effects' && <EffectsTab />}
        {tab === 'music' && <MusicTab />}
        {tab === 'setup' && <SetupTab />}
      </div>

      <footer class="panel-footer">
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
      </footer>
    </div>
  );
}
