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

type Mode = 'simple' | 'advanced';

function loadMode(): Mode {
  try {
    return localStorage.getItem('dreamloop.mode') === 'advanced' ? 'advanced' : 'simple';
  } catch {
    return 'simple';
  }
}

export function Panel() {
  const [mode, setMode] = useState<Mode>(loadMode);
  const [tab, setTab] = useState<TabId>(loadTab);
  const [collapsed, setCollapsed] = useState(false);
  const [sheetFull, setSheetFull] = useState(false);
  const advanced = mode === 'advanced';

  const pickMode = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem('dreamloop.mode', m);
    } catch {
      /* ignore */
    }
  };

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

  return (
    <div class={`panel ${sheetFull ? 'sheet-full' : ''}`}>
      <div class="sheet-handle" onClick={() => setSheetFull(!sheetFull)} />

      <header class="panel-header">
        <span class="panel-title">{T.appName}</span>
        <div class="mode-toggle">
          <button class={!advanced ? 'active' : ''} onClick={() => pickMode('simple')}>
            {T.simple}
          </button>
          <button class={advanced ? 'active' : ''} onClick={() => pickMode('advanced')}>
            {T.advanced}
          </button>
        </div>
        <button class="panel-collapse" onClick={() => setCollapsed(true)} title="Collapse">
          ›
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
        {tab === 'look' && <LookTab advanced={advanced} />}
        {tab === 'feel' && <FeelTab advanced={advanced} />}
        {tab === 'effects' && <EffectsTab advanced={advanced} />}
        {tab === 'music' && <MusicTab advanced={advanced} />}
        {tab === 'setup' && <SetupTab advanced={advanced} />}
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
