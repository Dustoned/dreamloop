import { SCENES } from '../effects';
import { store } from '../state/paramStore';
import { warmEffect } from '../engine/warmup';
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
  wormhole: 'radial-gradient(circle at 50% 50%, #0a0014 8%, #7a3fe0 35%, #ff5fd0 60%, #12082a 90%)',
  fractalcore: 'conic-gradient(from 45deg, #00ffee, #0a0014, #ff00cc, #0a0014, #00ffee, #0a0014, #ff00cc, #0a0014, #00ffee)',
  nebula: 'radial-gradient(ellipse at 35% 40%, #e91e8c 0%, #7a3fe0 30%, #02102a 75%)',
  mandelzoom: 'radial-gradient(circle at 62% 50%, #ffd23f 0%, #ff6b35 12%, #e91e8c 30%, #2d1b69 65%, #05010f 90%)',
  mandelbulb: 'radial-gradient(circle at 40% 35%, #caf0f8 0%, #00d4d8 20%, #0077b6 45%, #001b3a 85%)',
  juliamorph: 'radial-gradient(circle at 50% 50%, #faff00 0%, #ff00cc 25%, #00ffee 55%, #0a0014 88%)',
  infinitybox: 'conic-gradient(from 0deg at 50% 50%, #7dff00, #050a02, #eaff70, #050a02, #7dff00, #050a02, #eaff70, #050a02, #7dff00)',
  apollonian: 'radial-gradient(circle at 30% 30%, #ffe9b8 0%, #d9c8ff 18%, #b8f2d9 40%, #12082a 80%)',
  ribbons: 'linear-gradient(105deg, #02102a 8%, #00c896 30%, #7a3fe0 52%, #8ef0d2 70%, #02102a 92%)',
  bloomring: 'conic-gradient(from 0deg, #ff4fd8, #2b0f54 22%, #ff4fd8 45%, #2b0f54 68%, #ffb3ec 88%, #ff4fd8)',
  pulsewave: 'repeating-radial-gradient(circle at 50% 50%, #ffb300 0 5px, #3a0a00 5px 13px)',
  flame: 'radial-gradient(ellipse at 50% 62%, #ffe08a 0%, #ff6a00 22%, #c33000 48%, #000000 85%)',
  newton: 'conic-gradient(from 18deg, #00c896, #7a3fe0 25%, #8ef0d2 40%, #00c896 55%, #7a3fe0 75%, #8ef0d2 90%, #00c896)',
  spectrum: 'repeating-linear-gradient(90deg, #ff00cc 0 3px, #0a0014 3px 6px, #00ffee 6px 9px, #0a0014 9px 12px), linear-gradient(0deg, #faff00, #0a0014 70%)',
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
          // Start linking on press, so the shader is usually ready by the time the
          // click lands instead of stalling the first frame of the new scene.
          onPointerDown={() => warmEffect(s.id)}
          onMouseEnter={() => warmEffect(s.id)}
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
