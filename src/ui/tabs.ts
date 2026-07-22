export type TabId = 'look' | 'feel' | 'effects' | 'music' | 'setup';

export interface TabDef {
  id: TabId;
  icon: string;
  label: string;
}

/** Five short screens instead of one endless scroll. */
export const TABS: TabDef[] = [
  { id: 'look', icon: '🎨', label: 'Look' },
  { id: 'feel', icon: '🎛️', label: 'Feel' },
  { id: 'effects', icon: '✨', label: 'Effects' },
  { id: 'music', icon: '🎵', label: 'Music' },
  { id: 'setup', icon: '⚙️', label: 'Setup' },
];

const KEY = 'dreamloop.tab';

export function loadTab(): TabId {
  try {
    const v = localStorage.getItem(KEY);
    return TABS.some((t) => t.id === v) ? (v as TabId) : 'look';
  } catch {
    return 'look';
  }
}

export function saveTab(id: TabId): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* private mode */
  }
}
