export interface PalettePreset {
  id: string;
  name: string;
  stops: string[];
}

export const PALETTES: PalettePreset[] = [
  { id: 'sunset', name: 'Sunset', stops: ['#2d1b69', '#e91e8c', '#ff6b35', '#ffd23f'] },
  { id: 'ocean', name: 'Ocean', stops: ['#001b3a', '#0077b6', '#00d4d8', '#caf0f8'] },
  { id: 'neon', name: 'Neon', stops: ['#0a0014', '#ff00cc', '#00ffee', '#faff00'] },
  { id: 'rainbow', name: 'Rainbow', stops: ['#ff0040', '#ffe000', '#00e572', '#0080ff'] },
  { id: 'fire', name: 'Fire', stops: ['#0d0000', '#8f0f00', '#ff6a00', '#ffe08a'] },
  { id: 'aurora', name: 'Aurora', stops: ['#02102a', '#00c896', '#7a3fe0', '#8ef0d2'] },
  { id: 'ice', name: 'Ice', stops: ['#eaf8ff', '#8fd8ff', '#2a6fd8', '#0a2560'] },
  { id: 'candy', name: 'Candy', stops: ['#ffd1e8', '#b8f2d9', '#d9c8ff', '#ffe9b8'] },
  { id: 'toxic', name: 'Toxic', stops: ['#050a02', '#7dff00', '#eaff70', '#1a3a00'] },
  { id: 'mono', name: 'Mono', stops: ['#000000', '#ffffff'] },
];

export function paletteById(id: string | null): PalettePreset | undefined {
  return PALETTES.find((p) => p.id === id);
}
