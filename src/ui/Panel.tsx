import { useState } from 'preact/hooks';
import { T } from '../i18n/en';
import { SimplePanel } from './SimplePanel';
import { AdvancedPanel } from './AdvancedPanel';

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
  const [collapsed, setCollapsed] = useState(false);
  const [sheetFull, setSheetFull] = useState(false);

  const pickMode = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem('dreamloop.mode', m);
    } catch {
      /* ignore */
    }
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
          <button class={mode === 'simple' ? 'active' : ''} onClick={() => pickMode('simple')}>
            {T.simple}
          </button>
          <button class={mode === 'advanced' ? 'active' : ''} onClick={() => pickMode('advanced')}>
            {T.advanced}
          </button>
        </div>
        <button class="panel-collapse" onClick={() => setCollapsed(true)} title="Collapse">
          ›
        </button>
      </header>
      {mode === 'simple' ? <SimplePanel /> : <AdvancedPanel />}
    </div>
  );
}
