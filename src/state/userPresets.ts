import type { ParamState } from './types';

const KEY = 'dreamloop.userPresets.v1';
const SESSION_KEY = 'dreamloop.session.v1';
const MAX = 50;

export interface UserPreset {
  id: string;
  name: string;
  createdAt: number;
  state: ParamState;
}

export function listUserPresets(): UserPreset[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserPreset[]) : [];
  } catch {
    return [];
  }
}

function persist(list: UserPreset[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or private mode */
  }
}

export function saveUserPreset(name: string, state: ParamState): UserPreset | null {
  const list = listUserPresets();
  if (list.length >= MAX) return null;
  const preset: UserPreset = {
    id: `u${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
    name,
    createdAt: Date.now(),
    state: JSON.parse(JSON.stringify(state)) as ParamState,
  };
  persist([...list, preset]);
  return preset;
}

export function deleteUserPreset(id: string): void {
  persist(listUserPresets().filter((p) => p.id !== id));
}

export function nextPresetName(): string {
  const list = listUserPresets();
  let n = list.length + 1;
  while (list.some((p) => p.name === `My preset ${n}`)) n++;
  return `My preset ${n}`;
}

export function saveSession(state: ParamState): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadSession(): unknown {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
