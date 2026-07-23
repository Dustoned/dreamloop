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
  { id: 'vaporwave', name: 'Vaporwave', stops: ['#2b0f54', '#ff4fd8', '#00e5ff', '#ffb3ec'] },
  { id: 'gold', name: 'Gold', stops: ['#1a0e00', '#7a4a00', '#ffb300', '#fff3c4'] },
  { id: 'blacklight', name: 'Blacklight', stops: ['#05000f', '#3a00ff', '#c400ff', '#00ffa2'] },
  { id: 'forest', name: 'Forest', stops: ['#04140a', '#1f6f3a', '#8fd14f', '#e8f5c8'] },
  { id: 'deepsea', name: 'Deep Sea', stops: ['#00060f', '#013a63', '#2c7da0', '#61e8e1'] },
  { id: 'ember', name: 'Ember', stops: ['#000000', '#3a0a00', '#c33000', '#ffb26b'] },
  { id: 'mono', name: 'Mono', stops: ['#000000', '#ffffff'] },
];

export function paletteById(id: string | null): PalettePreset | undefined {
  return PALETTES.find((p) => p.id === id);
}
