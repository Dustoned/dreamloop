import { render } from 'preact';
import { GlContext } from './engine/gl';
import { Engine } from './engine/engine';
import { store } from './state/paramStore';
import { buildDefaultState, hydrate } from './state/defaults';
import { codeFromHash, decodeCode } from './state/urlCodec';
import { loadSession, saveSession } from './state/userPresets';
import { perfMonitor } from './engine/perf';
import { detectDevice } from './engine/device';
import { registerEngine, startIdleWarmup } from './engine/warmup';
import { consumePhoto } from './capture/screenshot';
import { audio } from './audio/audioEngine';
import { installShortcuts, installAutoHide } from './ui/shortcuts';
import { applyUiPrefs } from './ui/uiPrefs';
import { showToast } from './ui/Toast';
import { App } from './app';
import './styles/app.css';

store.init(buildDefaultState());

// Boot priority: shared code in the URL > last session > defaults.
let isReturningVisitor = false;
const hashCode = codeFromHash();
if (hashCode) {
  void decodeCode(hashCode).then((st) => {
    if (st) store.applySnapshot(st);
  });
  isReturningVisitor = true;
} else {
  const sess = loadSession();
  if (sess) {
    store.applySnapshot(hydrate(sess));
    isReturningVisitor = true;
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

let pumpClock = performance.now();

if (glc) {
  // The device profile now only chooses a first-visit starting point. Once you
  // have set anything yourself, nothing here overrules you again.
  const device = detectDevice(glc.gl);
  glc.allowFloatTargets = device.useFloatTargets;
  glc.useInvalidate = device.useInvalidate;
  if (!isReturningVisitor) {
    store.set('global.quality', device.startQuality);
    store.set('global.autoquality', device.tier !== 'high');
  }
  // Drop the frosted-glass blur, which the GPU would otherwise recompute over the
  // live canvas every frame.
  if (device.tier === 'low') document.body.classList.add('cheap-ui');

  const engine = new Engine(glc, () => store.state);
  registerEngine(engine);
  // Link the rest of the shaders while the browser is idle, so switching scenes
  // later never pays the compile cost.
  setTimeout(startIdleWarmup, 1500);
  if (import.meta.env.DEV) {
    const w = window as unknown as {
      __engine?: Engine;
      __store?: typeof store;
      __audio?: typeof audio;
      __perf?: typeof perfMonitor;
    };
    w.__engine = engine;
    w.__store = store;
    w.__audio = audio;
    // The real instance: a dynamic import from the console would give a second copy.
    w.__perf = perfMonitor;
    // Deterministic frame pump: a hidden preview pane throttles timers and never
    // fires rAF, so verification drives the engine directly instead of waiting.
    (w as unknown as { __pump: (n?: number, dt?: number) => number }).__pump = (
      n = 60,
      dt = 16.7,
    ) => {
      for (let i = 0; i < n; i++) {
        pumpClock += dt;
        audio.update();
        engine.render(pumpClock);
      }
      return engine.time;
    };
  }

  // In dev the preview pane is often not composited, so requestAnimationFrame
  // never fires and the loop would die for good. Race it against a timer —
  // whichever wins drives the next frame. Production keeps plain rAF, so a
  // hidden tab pauses and resumes on its own.
  const schedule = (cb: () => void): void => {
    if (!import.meta.env.DEV) {
      requestAnimationFrame(cb);
      return;
    }
    let fired = false;
    const once = (): void => {
      if (fired) return;
      fired = true;
      cb();
    };
    requestAnimationFrame(once);
    setTimeout(once, 40);
  };
  engine.audio = audio.frame;
  const perf = perfMonitor;
  let lastFrame = 0;
  let toldUser = false;
  let errorsLogged = 0;
  const frame = (): void => {
    const now = performance.now();
    try {
      audio.update();
      engine.render(now);
      consumePhoto(canvas);
      // A frame spent linking a shader is not a slow frame — do not let it trigger
      // a quality cut, and do not measure across a tab that was in the background.
      if (!document.hidden && lastFrame > 0 && !engine.compiling) {
        perf.sample(now - lastFrame, now, store.state.params['global.quality'] as number);
        engine.degradeScale = perf.degrade;
        if (perf.justDegraded) {
          perf.justDegraded = false;
          if (!toldUser) {
            toldUser = true;
            showToast('Turned the quality down so it stays smooth. Change it under Performance.');
          }
        }
      }
      lastFrame = now;
    } catch (err) {
      // One bad frame must never end the loop — that would freeze the app for good.
      if (errorsLogged++ < 5) console.error('[dreamloop] frame failed', err);
      lastFrame = 0;
    } finally {
      schedule(frame);
    }
  };
  schedule(frame);

  // The perf monitor must not read a huge delta after the tab was in the background.
  document.addEventListener('visibilitychange', () => {
    lastFrame = 0;
    perf.reset();
  });

  // Scene switches, preset loads and Surprise Me all cost one expensive frame on
  // any machine. Those are not evidence that the device is slow.
  store.subscribeStructure(() => perf.ignoreFrames(25));

  // Losing the GPU context leaves a permanently black canvas otherwise; on weak
  // devices a long heavy shader can genuinely trigger a driver reset.
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    showToast('Graphics hiccup — reloading to recover.');
    setTimeout(() => location.reload(), 1200);
  });
} else {
  document.body.classList.add('no-webgl');
  const msg = document.createElement('div');
  msg.className = 'no-webgl-msg';
  msg.textContent =
    "Your browser doesn't support WebGL2, which Dreamloop needs for its visuals. Try Chrome, Edge or Firefox on a computer or a recent phone.";
  document.body.appendChild(msg);
}

applyUiPrefs();
installShortcuts();
installAutoHide();
render(<App />, document.getElementById('app')!);
