import { render } from 'preact';
import { GlContext } from './engine/gl';
import { Engine } from './engine/engine';
import { store } from './state/paramStore';
import { buildDefaultState, hydrate } from './state/defaults';
import { codeFromHash, decodeCode } from './state/urlCodec';
import { loadSession, saveSession } from './state/userPresets';
import { PerfMonitor } from './engine/perf';
import { consumePhoto } from './capture/screenshot';
import { audio } from './audio/audioEngine';
import { installShortcuts, installAutoHide } from './ui/shortcuts';
import { showToast } from './ui/Toast';
import { App } from './app';
import './styles/app.css';

store.init(buildDefaultState());

// Boot priority: shared code in the URL > last session > defaults.
const hashCode = codeFromHash();
if (hashCode) {
  void decodeCode(hashCode).then((st) => {
    if (st) store.applySnapshot(st);
  });
} else {
  const sess = loadSession();
  if (sess) store.applySnapshot(hydrate(sess));
  else if (window.matchMedia('(max-width: 719px)').matches) {
    store.set('global.quality', 0.6);
  }
}

// Debounced session autosave: your own creation greets you on the next visit.
let lastSaved = '';
setInterval(() => {
  const json = JSON.stringify(store.state);
  if (json !== lastSaved) {
    lastSaved = json;
    saveSession(store.state);
  }
}, 3000);

const canvas = document.getElementById('gl') as HTMLCanvasElement;
let glc: GlContext | null = null;
try {
  // preserveDrawingBuffer in dev so the canvas can be inspected headlessly.
  glc = new GlContext(canvas, { preserveDrawingBuffer: import.meta.env.DEV });
} catch {
  glc = null;
}

if (glc) {
  const engine = new Engine(glc, () => store.state);
  if (import.meta.env.DEV) {
    const w = window as unknown as {
      __engine?: Engine;
      __store?: typeof store;
      __audio?: typeof audio;
    };
    w.__engine = engine;
    w.__store = store;
    w.__audio = audio;
  }

  // In dev, keep rendering (via setTimeout) even when the page reports hidden,
  // so headless verification works. In production a hidden page pauses; the
  // queued rAF fires again as soon as the page becomes visible.
  const schedule = (cb: () => void): void => {
    if (import.meta.env.DEV && document.hidden) setTimeout(cb, 33);
    else requestAnimationFrame(cb);
  };
  engine.audio = audio.frame;
  const perf = new PerfMonitor();
  let lastFrame = 0;
  const frame = (): void => {
    const now = performance.now();
    audio.update();
    engine.render(now);
    consumePhoto(canvas);
    if (!document.hidden && lastFrame > 0) {
      perf.sample(now - lastFrame, now);
      engine.degradeScale = perf.degrade;
      if (perf.justDegraded) {
        perf.justDegraded = false;
        showToast('Quality lowered a bit to keep things smooth.');
      }
    }
    lastFrame = now;
    schedule(frame);
  };
  schedule(frame);
} else {
  document.body.classList.add('no-webgl');
  const msg = document.createElement('div');
  msg.className = 'no-webgl-msg';
  msg.textContent =
    "Your browser doesn't support WebGL2, which Dreamloop needs for its visuals. Try Chrome, Edge or Firefox on a computer or a recent phone.";
  document.body.appendChild(msg);
}

installShortcuts();
installAutoHide();
render(<App />, document.getElementById('app')!);
