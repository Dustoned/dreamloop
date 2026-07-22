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

const KEY = 'dreamloop.ui.v1';

const DEFAULTS: UiPrefs = { autoHide: true, hideDelay: 3, side: 'right', hidden: false };

function load(): UiPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      autoHide: p.autoHide !== false,
      hideDelay: typeof p.hideDelay === 'number' ? Math.min(30, Math.max(1, p.hideDelay)) : 3,
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
