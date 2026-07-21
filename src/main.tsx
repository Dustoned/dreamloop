import { render } from 'preact';
import { GlContext } from './engine/gl';
import { Engine } from './engine/engine';
import { store } from './state/paramStore';
import { buildDefaultState } from './state/defaults';
import { App } from './app';
import './styles/app.css';

store.init(buildDefaultState());

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
    const w = window as unknown as { __engine?: Engine; __store?: typeof store };
    w.__engine = engine;
    w.__store = store;
  }

  // In dev, keep rendering (via setTimeout) even when the page reports hidden,
  // so headless verification works. In production a hidden page pauses; the
  // queued rAF fires again as soon as the page becomes visible.
  const schedule = (cb: () => void): void => {
    if (import.meta.env.DEV && document.hidden) setTimeout(cb, 33);
    else requestAnimationFrame(cb);
  };
  const frame = (): void => {
    engine.render(performance.now());
    schedule(frame);
  };
  schedule(frame);
} else {
  document.body.classList.add('no-webgl');
}

render(<App />, document.getElementById('app')!);
