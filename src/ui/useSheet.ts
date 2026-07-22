import { useEffect, useRef, useState } from 'preact/hooks';

/** Bottom-sheet heights, in vh. Peek keeps most of the visual on screen. */
export const SNAPS = [30, 58, 90];

/** Matches the bottom-sheet breakpoint in app.css. */
const SHEET_MQ = '(max-width: 719px)';
/** A landscape phone gets a side panel instead, sized by CSS — no inline height. */
const SIDE_MQ = '(max-width: 900px) and (max-height: 500px) and (orientation: landscape)';

export interface SheetControl {
  snap: number;
  /** Live height while dragging, or null when settled. */
  dragVh: number | null;
  /** True while the panel is a bottom sheet rather than a desktop side panel. */
  active: boolean;
  /** Raise a folded-away sheet to a height that shows its content. */
  open: () => void;
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: () => void;
}

/**
 * Drag the handle to resize the sheet; a tap cycles through the snap points.
 * Both matter on a phone: dragging is discoverable, tapping is quick.
 */
export function useSheet(): SheetControl {
  // Open at the middle height. Peek is a useful state to go back to, but as the
  // first thing a phone shows it is a sheet with no settings in it at all.
  const [snap, setSnap] = useState(1);
  const [dragVh, setDragVh] = useState<number | null>(null);
  const start = useRef<{ y: number; vh: number; moved: boolean } | null>(null);
  const live = useRef<number>(SNAPS[1]);
  const isSheet = (): boolean => matchMedia(SHEET_MQ).matches && !matchMedia(SIDE_MQ).matches;
  const [active, setActive] = useState(isSheet);

  useEffect(() => {
    const a = matchMedia(SHEET_MQ);
    const b = matchMedia(SIDE_MQ);
    const sync = (): void => setActive(a.matches && !b.matches);
    a.addEventListener('change', sync);
    b.addEventListener('change', sync);
    return () => {
      a.removeEventListener('change', sync);
      b.removeEventListener('change', sync);
    };
  }, []);

  return {
    snap,
    dragVh,
    active,
    open: () => setSnap((v) => (v === 0 ? 1 : v)),
    onPointerDown: (e) => {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Capture is an optimisation, not a requirement — never let it abort the drag.
      }
      start.current = { y: e.clientY, vh: SNAPS[snap], moved: false };
      live.current = SNAPS[snap];
      // Deliberately NOT setDragVh here. Doing so switched the panel out of its
      // snap class the instant you touched the handle, so a plain tap made the
      // sheet twitch before you had dragged anything.
    },
    onPointerMove: (e) => {
      const s = start.current;
      if (!s) return;
      const deltaVh = ((s.y - e.clientY) / window.innerHeight) * 100;
      if (Math.abs(deltaVh) > 1.5) s.moved = true;
      live.current = Math.min(92, Math.max(18, s.vh + deltaVh));
      if (s.moved) setDragVh(live.current);
    },
    onPointerUp: () => {
      const s = start.current;
      start.current = null;
      setDragVh(null);
      if (!s) return;
      if (!s.moved) {
        setSnap((v) => (v + 1) % SNAPS.length);
        return;
      }
      let best = 0;
      for (let i = 1; i < SNAPS.length; i++) {
        if (Math.abs(SNAPS[i] - live.current) < Math.abs(SNAPS[best] - live.current)) best = i;
      }
      setSnap(best);
    },
  };
}
