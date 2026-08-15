import { audio } from '../audio/audioEngine';
import { showToast } from '../ui/Toast';

/**
 * Video recording: canvas.captureStream + the audio recordTap (which carries
 * exactly what is playing) muxed into one WebM through MediaRecorder. The tap
 * was wired into the audio graph on day one for precisely this feature.
 */
class Recorder {
  recording = false;
  startedAt = 0;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  start(canvas: HTMLCanvasElement): void {
    if (this.recording) return;
    try {
      const stream = canvas.captureStream(60);
      // Add the music, when something is playing: the tap captures the exact mix.
      if (audio.kind !== 'none' && audio.recordTap) {
        for (const t of audio.recordTap.stream.getAudioTracks()) stream.addTrack(t);
      }
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
        .find((m) => MediaRecorder.isTypeSupported(m));
      this.rec = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 12_000_000,
      });
      this.chunks = [];
      this.rec.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      this.rec.onstop = () => this.finish();
      this.rec.start(1000); // gather a chunk every second, so a crash loses little
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
    this.rec.stop(); // finish() runs from onstop, after the last chunk lands
    this.emit();
  }

  toggle(canvas: HTMLCanvasElement): void {
    if (this.recording) this.stop();
    else this.start(canvas);
  }

  private finish(): void {
    const blob = new Blob(this.chunks, { type: this.rec?.mimeType || 'video/webm' });
    this.rec = null;
    this.chunks = [];
    if (blob.size < 1000) {
      showToast('The recording came out empty — try again.');
      this.emit();
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    a.download = `dreamloop-${stamp}.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    showToast('Saved your video 🎬');
    this.emit();
  }
}

export const recorder = new Recorder();
