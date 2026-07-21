import { useEffect, useState } from 'preact/hooks';

interface ToastMsg {
  id: number;
  text: string;
  action?: { label: string; fn: () => void };
}

let push: (t: Omit<ToastMsg, 'id'>) => void = () => {};

export function showToast(text: string, action?: { label: string; fn: () => void }): void {
  push({ text, action });
}

export function Toasts() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  useEffect(() => {
    let n = 0;
    push = (t) => {
      const id = ++n;
      setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 6000);
    };
    return () => {
      push = () => {};
    };
  }, []);
  if (!toasts.length) return null;
  return (
    <div class="toasts">
      {toasts.map((t) => (
        <div class="toast" key={t.id}>
          <span>{t.text}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action!.fn();
                setToasts((ts) => ts.filter((x) => x.id !== t.id));
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
