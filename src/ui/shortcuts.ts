import { store } from '../state/paramStore';
import { makeSurprise, snapshotState } from '../state/surprise';
import { requestPhoto } from '../capture/screenshot';
import { party } from '../party/partyMode';
import { showToast } from './Toast';
import { uiPrefs, setUiPref, subscribeUi } from './uiPrefs';
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
  setUiPref('hidden', !uiPrefs.hidden);
  if (uiPrefs.hidden) showToast('Controls hidden — press H to bring them back.');
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
  let heldSince = 0;

  // Treat a press as "held" only briefly. A missed pointerup (context menu, an
  // element removed mid-drag, a lost pointer capture) used to latch this on and
  // the controls would then never fade again.
  const isHeld = (): boolean => heldSince > 0 && performance.now() - heldSince < 5000;

  const hide = (): void => {
    if (!uiPrefs.autoHide) return;
    // Still holding: check again shortly rather than giving up, otherwise a press
    // whose release never arrives would keep the controls up forever.
    if (isHeld()) {
      timer = setTimeout(hide, 500);
      return;
    }
    document.body.classList.add('ui-idle');
  };
  const wake = (): void => {
    document.body.classList.remove('ui-idle');
    clearTimeout(timer);
    if (uiPrefs.autoHide) timer = setTimeout(hide, uiPrefs.hideDelay * 1000);
  };

  addEventListener('pointermove', wake, { passive: true });
  addEventListener('pointerdown', () => {
    heldSince = performance.now();
    wake();
  });
  const release = (): void => {
    heldSince = 0;
    wake();
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('blur', release);
  addEventListener('keydown', wake);
  addEventListener('touchstart', wake, { passive: true });
  addEventListener('wheel', wake, { passive: true });

  subscribeUi(wake); // re-arm when the delay or the toggle changes
  wake();
}
