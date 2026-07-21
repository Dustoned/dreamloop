import { useEffect, useState } from 'preact/hooks';
import { T } from '../i18n/en';

export function HintOverlay() {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem('dreamloop.seenIntro');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return;
    const dismiss = () => {
      try {
        localStorage.setItem('dreamloop.seenIntro', '1');
      } catch {
        /* private mode */
      }
      setShow(false);
    };
    const t = setTimeout(dismiss, 12000);
    window.addEventListener('pointerdown', dismiss, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', dismiss);
    };
  }, [show]);

  if (!show) return null;
  return <div class="hint-pill">{T.hint}</div>;
}
