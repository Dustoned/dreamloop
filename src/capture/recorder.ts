import { audio } from '../audio/audioEngine';
import { showToast } from '../ui/Toast';

/**
 * Video recording: canvas.captureStream + the audio recordTap (which carries
 * exactly what is playing) muxed into one WebM through MediaRecorder. The tap
 * was wired into the audio graph on day one for precisely this feature.
 *
 * Lifecycle care: MediaRecorder's onstop fires asynchronously (the muxer flush
 * can take hundreds of ms), so each take owns its chunks via closure, onstop is
 * instance-checked, and start() refuses while a previous take is finalizing —
 * otherwise a quick stop→start could orphan a live recorder and wedge the UI.
 */
class Recorder {
  recording = false;
  startedAt = 0;
  private rec: MediaRecorder | null = null;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  start(canvas: HTMLCanvasElement): void {
    // this.rec stays set until onstop lands, so this also blocks re-starting
    // while the previous take is still flushing.
    if (this.recording || this.rec) return;
    try {
      const stream = canvas.captureStream(60);
      // Add the music, when something is playing: the tap captures the exact mix.
      if (audio.kind !== 'none' && audio.recordTap) {
        for (const t of audio.recordTap.stream.getAudioTracks()) stream.addTrack(t);
      }
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
        .find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 12_000_000,
      });
      const chunks: Blob[] = []; // owned by THIS take, whatever the singleton does
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onerror = () => showToast('Recording hit an error — saving what we have.');
      rec.onstop = () => {
        // Runs for user stops AND spontaneous encoder stops; always release the
        // state, but only if a newer take has not replaced us.
        if (this.rec === rec) this.rec = null;
        this.recording = false;
        this.save(chunks, rec.mimeType);
        this.emit();
      };
      rec.start(1000); // gather a chunk every second, so a crash loses little
      this.rec = rec;
      this.recording = true;
      this.startedAt = performance.now();
      showToast('Recording… hit the button again to stop and save.');
    } catch {
      showToast('Recording is not supported in this browser.');
      this.rec = null;
      this.recording = false;
    }
    this.emit();
  }

  stop(): void {
    if (!this.rec || !this.recording) return;
    this.recording = false;
    this.rec.stop(); // save() runs from onstop, after the last chunk lands
    this.emit();
  }

  toggle(canvas: HTMLCanvasElement): void {
    if (this.recording) this.stop();
    else this.start(canvas);
  }

  private save(chunks: Blob[], mime: string): void {
    const blob = new Blob(chunks, { type: mime || 'video/webm' });
    if (blob.size < 1000) {
      showToast('The recording came out empty — try again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    a.download = `dreamloop-${stamp}.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    showToast('Saved your video 🎬');
  }
}

export const recorder = new Recorder();
