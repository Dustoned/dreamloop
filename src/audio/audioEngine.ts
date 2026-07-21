import type { AudioFrame } from '../state/types';

export type AudioSourceKind = 'none' | 'file' | 'tab' | 'mic';

/**
 * One AudioContext for the app. Graph: source -> [analyser, speakers?, recordTap].
 * The analyser fills a mutable AudioFrame each frame (read directly by the
 * engine, zero events); source/error changes notify UI subscribers.
 */
class AudioEngine {
  frame: AudioFrame = { bass: 0, mid: 0, treble: 0, beat: 0 };
  kind: AudioSourceKind = 'none';
  error = '';
  trackName = '';
  audioEl: HTMLAudioElement | null = null;
  /** Tap for future video recording: captures exactly what plays. */
  recordTap: MediaStreamAudioDestinationNode | null = null;

  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private sourceNode: AudioNode | null = null;
  private fileNode: MediaElementAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private listeners = new Set<() => void>();

  private sm = { bass: 0, mid: 0, treble: 0 };
  private beatAvg = 0;
  private beatCooldown = 0;
  private beatEnv = 0;

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  get tabAudioSupported(): boolean {
    return !!navigator.mediaDevices?.getDisplayMedia;
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.4;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.recordTap = this.ctx.createMediaStreamDestination();
    }
    void this.ctx.resume();
    return this.ctx;
  }

  private disconnectSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        /* already disconnected */
      }
      this.sourceNode = null;
    }
  }

  private stopStream(): void {
    if (this.stream) {
      for (const t of this.stream.getTracks()) t.stop();
      this.stream = null;
    }
  }

  private connect(node: AudioNode, toSpeakers: boolean): void {
    this.disconnectSource();
    this.sourceNode = node;
    node.connect(this.analyser!);
    if (toSpeakers) node.connect(this.ctx!.destination);
    node.connect(this.recordTap!);
  }

  async useFile(file: File): Promise<void> {
    try {
      const ctx = this.ensureCtx();
      this.stopStream();
      if (!this.audioEl) {
        this.audioEl = new Audio();
        this.audioEl.loop = true;
        // createMediaElementSource may only be called once per element
        this.fileNode = ctx.createMediaElementSource(this.audioEl);
      }
      if (this.audioEl.src) URL.revokeObjectURL(this.audioEl.src);
      this.audioEl.src = URL.createObjectURL(file);
      this.connect(this.fileNode!, true);
      await this.audioEl.play();
      this.kind = 'file';
      this.trackName = file.name;
      this.error = '';
    } catch {
      this.error = 'Could not play this file. Try an MP3, WAV or OGG.';
    }
    this.emit();
  }

  async useMic(): Promise<void> {
    try {
      const ctx = this.ensureCtx();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pauseFile();
      this.stopStream();
      this.stream = stream;
      // never route the mic to the speakers (feedback loop)
      this.connect(ctx.createMediaStreamSource(stream), false);
      stream.getAudioTracks()[0]?.addEventListener('ended', () => this.stop());
      this.kind = 'mic';
      this.trackName = '';
      this.error = '';
    } catch {
      this.error =
        'Microphone access was denied. Click the lock icon next to the address bar to allow it, then try again.';
    }
    this.emit();
  }

  async useTab(): Promise<void> {
    try {
      const ctx = this.ensureCtx();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (!stream.getAudioTracks().length) {
        for (const t of stream.getTracks()) t.stop();
        this.error = "No audio came through. Tick 'Share audio' when choosing the tab.";
        this.emit();
        return;
      }
      for (const t of stream.getVideoTracks()) t.stop();
      this.pauseFile();
      this.stopStream();
      this.stream = stream;
      // the shared tab already plays its own audio
      this.connect(ctx.createMediaStreamSource(stream), false);
      stream.getAudioTracks()[0].addEventListener('ended', () => this.stop());
      this.kind = 'tab';
      this.trackName = '';
      this.error = '';
    } catch {
      this.error = 'Sharing was cancelled.';
    }
    this.emit();
  }

  private pauseFile(): void {
    this.audioEl?.pause();
  }

  toggleFilePlayback(): void {
    if (!this.audioEl) return;
    if (this.audioEl.paused) void this.audioEl.play();
    else this.audioEl.pause();
    this.emit();
  }

  stop(): void {
    this.disconnectSource();
    this.stopStream();
    this.pauseFile();
    this.kind = 'none';
    this.trackName = '';
    this.error = '';
    this.frame.bass = this.frame.mid = this.frame.treble = this.frame.beat = 0;
    this.emit();
  }

  /** Called once per rendered frame from the main loop. */
  update(): void {
    const f = this.frame;
    if (!this.analyser || this.kind === 'none') {
      f.bass *= 0.9;
      f.mid *= 0.9;
      f.treble *= 0.9;
      f.beat *= 0.9;
      return;
    }
    const d = this.freqData!;
    this.analyser.getByteFrequencyData(d);
    // fftSize 2048 @ ~48kHz -> ~23.4 Hz per bin
    const avg = (a: number, b: number) => {
      let s = 0;
      for (let i = a; i < b; i++) s += d[i];
      return s / (b - a) / 255;
    };
    const rawBass = avg(1, 11); // ~23-260 Hz
    const rawMid = avg(11, 86); // ~260-2000 Hz
    const rawTreble = avg(86, 513); // ~2-12 kHz

    // fast attack, slow release
    const sm = (cur: number, raw: number) =>
      raw > cur ? cur + (raw - cur) * 0.55 : cur + (raw - cur) * 0.12;
    this.sm.bass = sm(this.sm.bass, rawBass);
    this.sm.mid = sm(this.sm.mid, rawMid);
    this.sm.treble = sm(this.sm.treble, rawTreble);
    f.bass = this.sm.bass;
    f.mid = this.sm.mid;
    f.treble = Math.min(1, this.sm.treble * 2.2); // treble band is naturally quieter

    // beat: bass energy spike vs rolling average, with a refractory period
    this.beatAvg = this.beatAvg * 0.985 + rawBass * 0.015;
    this.beatCooldown = Math.max(0, this.beatCooldown - 1);
    if (this.beatCooldown === 0 && rawBass > 0.15 && rawBass > this.beatAvg * 1.45) {
      this.beatEnv = 1;
      this.beatCooldown = 14;
    }
    this.beatEnv *= 0.92;
    f.beat = this.beatEnv;
  }
}

export const audio = new AudioEngine();
