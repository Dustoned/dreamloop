const KEY = 'dreamloop.userPalettes.v1';
const MAX = 40;
const HEX = /^#[0-9a-fA-F]{6}$/;

export interface UserPalette {
  id: string;
  stops: string[];
  createdAt: number;
}

export function listUserPalettes(): UserPalette[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as UserPalette[];
    // Trust nothing from storage: keep only well-formed 2–4-stop entries.
    return list.filter(
      (p) =>
        p &&
        Array.isArray(p.stops) &&
        p.stops.length >= 2 &&
        p.stops.length <= 4 &&
        p.stops.every((s) => typeof s === 'string' && HEX.test(s)),
    );
  } catch {
    return [];
  }
}

function persist(list: UserPalette[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or private mode */
  }
}

/** Save the given stops as a keepable palette, unless an identical one exists. */
export function saveUserPalette(stops: string[]): UserPalette | null {
  const list = listUserPalettes();
  if (list.length >= MAX) return null;
  const key = stops.join(',').toLowerCase();
  if (list.some((p) => p.stops.join(',').toLowerCase() === key)) return null;
  const pal: UserPalette = {
    id: `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
    stops: [...stops],
    createdAt: Date.now(),
  };
  persist([...list, pal]);
  return pal;
}

export function deleteUserPalette(id: string): void {
  persist(listUserPalettes().filter((p) => p.id !== id));
}
