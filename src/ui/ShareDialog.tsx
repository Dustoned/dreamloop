import { useEffect, useState } from 'preact/hooks';
import { store } from '../state/paramStore';
import { encodeState, decodeCode, shareUrl } from '../state/urlCodec';
import { showToast } from './Toast';

let openFn: () => void = () => {};

export function openShareDialog(): void {
  openFn();
}

export function ShareDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [importVal, setImportVal] = useState('');

  useEffect(() => {
    openFn = () => {
      setOpen(true);
      setCode('');
      setImportVal('');
      void encodeState(store.state).then(setCode);
    };
    return () => {
      openFn = () => {};
    };
  }, []);

  if (!open) return null;

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(msg);
    } catch {
      showToast('Could not copy — your browser blocked it.');
    }
  };

  const doImport = async () => {
    const cleaned = importVal.trim().replace(/^.*#p=/, '');
    if (!cleaned) return;
    const st = await decodeCode(cleaned);
    if (st) {
      store.applySnapshot(st);
      showToast('Loaded! Enjoy the look.');
      setOpen(false);
    } else {
      showToast("That code doesn't look right.");
    }
  };

  return (
    <div class="dialog-backdrop" onClick={() => setOpen(false)}>
      <div class="dialog" onClick={(e) => e.stopPropagation()}>
        <div class="dialog-head">
          <h3>Share this look</h3>
          <button class="dialog-close" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>
        <p class="dialog-sub">
          Anyone who opens your link or pastes your code gets exactly this visual.
        </p>
        <div class="dialog-actions">
          <button
            class="dialog-btn"
            disabled={!code}
            onClick={() => void copy(shareUrl(code), 'Link copied!')}
          >
            🔗 Copy link
          </button>
          <button
            class="dialog-btn"
            disabled={!code}
            onClick={() => void copy(code, 'Code copied!')}
          >
            📋 Copy code
          </button>
        </div>
        <div class="dialog-sep">Got a code from a friend?</div>
        <div class="dialog-import">
          <input
            type="text"
            placeholder="Paste a code or link…"
            value={importVal}
            onInput={(e) => setImportVal((e.currentTarget as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void doImport();
            }}
          />
          <button class="dialog-btn" onClick={() => void doImport()}>
            Load
          </button>
        </div>
      </div>
    </div>
  );
}
