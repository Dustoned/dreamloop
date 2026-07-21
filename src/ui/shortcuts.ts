import { store } from '../state/paramStore';
import { makeSurprise, snapshotState } from '../state/surprise';
import { requestPhoto } from '../capture/screenshot';
import { party } from '../party/partyMode';
import { showToast } from './Toast';
import { T } from '../i18n/en';

export function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}

export function doSurprise(): void {
  const prev = snapshotState();
  store.applySnapshot(makeSurprise());
  showToast(T.surprised, { label: T.undo, fn: () => store.applySnapshot(prev) });
}

let prevSpeed = 1;

export function togglePause(): void {
  const cur = store.state.params['global.speed'] as number;
  if (cur > 0) {
    prevSpeed = cur;
    store.set('global.speed', 0);
  } else {
    store.set('global.speed', prevSpeed || 1);
  }
}

export function togglePanel(): void {
  document.body.classList.toggle('panel-hidden');
}

export function installShortcuts(): void {
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    switch (e.code) {
      case 'Space':
        togglePause();
        e.preventDefault();
        break;
      case 'KeyR':
        doSurprise();
        break;
      case 'KeyF':
        toggleFullscreen();
        break;
      case 'KeyH':
        togglePanel();
        break;
      case 'KeyS':
        requestPhoto();
        break;
      case 'KeyP':
        if (party.active) party.stop();
        else party.start();
        break;
    }
  });

  // Double-click/tap on the canvas toggles fullscreen.
  document.getElementById('gl')?.addEventListener('dblclick', toggleFullscreen);
}

/** Fade the UI (and cursor) after inactivity; any activity restores it. */
export function installAutoHide(): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pointerHeld = false;

  const hide = () => {
    if (pointerHeld) return;
    document.body.classList.add('ui-idle');
  };
  const wake = () => {
    document.body.classList.remove('ui-idle');
    clearTimeout(timer);
    timer = setTimeout(hide, 4000);
  };

  window.addEventListener('pointermove', wake, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    pointerHeld = true;
    wake();
    void e;
  });
  window.addEventListener('pointerup', () => {
    pointerHeld = false;
    wake();
  });
  window.addEventListener('keydown', wake);
  window.addEventListener('touchstart', wake, { passive: true });
  wake();
}
