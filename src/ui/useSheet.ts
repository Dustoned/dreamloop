import { useRef, useState } from 'preact/hooks';

/** Bottom-sheet heights, in vh. Peek keeps most of the visual on screen. */
export const SNAPS = [30, 58, 90];

export interface SheetControl {
  snap: number;
  /** Live height while dragging, or null when settled. */
  dragVh: number | null;
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: () => void;
}

/**
 * Drag the handle to resize the sheet; a tap cycles through the snap points.
 * Both matter on a phone: dragging is discoverable, tapping is quick.
 */
export function useSheet(): SheetControl {
  const [snap, setSnap] = useState(0);
  const [dragVh, setDragVh] = useState<number | null>(null);
  const start = useRef<{ y: number; vh: number; moved: boolean } | null>(null);
  const live = useRef<number>(SNAPS[0]);

  return {
    snap,
    dragVh,
    onPointerDown: (e) => {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Capture is an optimisation, not a requirement — never let it abort the drag.
      }
      start.current = { y: e.clientY, vh: SNAPS[snap], moved: false };
      live.current = SNAPS[snap];
      setDragVh(SNAPS[snap]);
    },
    onPointerMove: (e) => {
      const s = start.current;
      if (!s) return;
      const deltaVh = ((s.y - e.clientY) / window.innerHeight) * 100;
      if (Math.abs(deltaVh) > 1.5) s.moved = true;
      live.current = Math.min(92, Math.max(18, s.vh + deltaVh));
      setDragVh(live.current);
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
