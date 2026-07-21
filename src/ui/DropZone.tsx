import { useEffect, useState } from 'preact/hooks';
import { audio } from '../audio/audioEngine';

/** Full-viewport drop target: drag a music file anywhere onto the page. */
export function DropZone() {
  const [over, setOver] = useState(false);

  useEffect(() => {
    let depth = 0;
    const enter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      depth++;
      setOver(true);
      e.preventDefault();
    };
    const overH = (e: DragEvent) => e.preventDefault();
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setOver(false);
    };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setOver(false);
      const f = e.dataTransfer?.files?.[0];
      if (f && (f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(f.name))) {
        void audio.useFile(f);
      }
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', overH);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', overH);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  if (!over) return null;
  return (
    <div class="dropzone">
      <div class="dropzone-inner">🎵 Drop your music here</div>
    </div>
  );
}
