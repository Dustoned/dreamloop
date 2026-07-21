import { SCENES } from '../effects';
import { store } from '../state/paramStore';
import { useStructure } from './hooks/useParam';

const THUMB_GRADIENTS: Record<string, string> = {
  plasma: 'radial-gradient(circle at 30% 30%, #ff00cc, #0a0014 70%), radial-gradient(circle at 70% 70%, #00ffee, transparent 60%)',
  tunnel: 'radial-gradient(circle at 50% 50%, #ffd23f 0%, #e91e8c 30%, #2d1b69 75%)',
  mandala: 'conic-gradient(from 0deg, #7a3fe0, #00c896, #7a3fe0, #00c896, #7a3fe0)',
  marble: 'linear-gradient(115deg, #0077b6 15%, #caf0f8 38%, #00d4d8 55%, #001b3a 85%)',
  kali: 'radial-gradient(circle at 60% 40%, #eaff70, #7dff00 30%, #050a02 80%)',
  interference: 'repeating-radial-gradient(circle at 35% 50%, #ff5fd0 0 6px, #12082a 6px 14px)',
  stars: 'radial-gradient(circle at 20% 30%, #fff 1%, transparent 2%), radial-gradient(circle at 70% 60%, #8fd8ff 1%, #0a2560 60%)',
  geometry: 'conic-gradient(from 30deg, #ffd23f, #ff6b35, #ffd23f, #ff6b35, #ffd23f, #ff6b35, #ffd23f)',
  cells: 'radial-gradient(circle at 30% 40%, #b8f2d9 8%, #2a6fd8 30%, #0a1030 70%)',
  tissue: 'radial-gradient(circle at 55% 45%, #ff6a00 5%, #8f0f00 40%, #0d0000 80%)',
};

export function ScenePicker() {
  useStructure();
  const active = store.state.scene;
  return (
    <div class="scene-strip">
      {SCENES.map((s) => (
        <button
          key={s.id}
          class={`scene-card ${s.id === active ? 'active' : ''}`}
          onClick={() => store.mutate((st) => (st.scene = s.id))}
        >
          <span class="scene-thumb" style={{ background: THUMB_GRADIENTS[s.id] ?? '#222' }}>
            <span class="scene-emoji">{s.icon}</span>
          </span>
          <span class="scene-name">{s.name}</span>
        </button>
      ))}
    </div>
  );
}
