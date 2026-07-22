export interface UiPrefs {
  /** Fade the controls away when the mouse sits still. */
  autoHide: boolean;
  /** Seconds of stillness before they fade. */
  hideDelay: number;
  /** Which edge the panel sits against. */
  side: 'left' | 'right';
  /** Controls stay hidden until explicitly shown again (H). */
  hidden: boolean;
}

// v2: the default delay went from 3 s to 8 s. Three seconds is shorter than it
// takes to read a row of labels, so the controls kept vanishing mid-thought.
// Bumping the key is what lets everyone who never touched the setting get the
// new default; it costs a one-time reset of the panel side and hidden flag.
const KEY = 'dreamloop.ui.v2';

const DEFAULTS: UiPrefs = { autoHide: true, hideDelay: 8, side: 'right', hidden: false };

function load(): UiPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      autoHide: p.autoHide !== false,
      hideDelay: typeof p.hideDelay === 'number' ? Math.min(60, Math.max(2, p.hideDelay)) : 8,
      side: p.side === 'left' ? 'left' : 'right',
      hidden: p.hidden === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export const uiPrefs: UiPrefs = load();

const listeners = new Set<() => void>();

export function subscribeUi(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setUiPref<K extends keyof UiPrefs>(key: K, value: UiPrefs[K]): void {
  uiPrefs[key] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(uiPrefs));
  } catch {
    /* private mode */
  }
  applyUiPrefs();
  for (const fn of listeners) fn();
}

/** Reflect the preferences onto <body> so CSS can do the rest. */
export function applyUiPrefs(): void {
  document.body.classList.toggle('panel-left', uiPrefs.side === 'left');
  document.body.classList.toggle('panel-hidden', uiPrefs.hidden);
}
