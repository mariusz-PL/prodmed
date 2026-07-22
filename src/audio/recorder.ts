/** Notatki głosowe: MediaRecorder, strumień otwierany tylko na czas nagrania. */

export function recordingSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

function pickMime(): string {
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
  for (const c of candidates) if (MediaRecorder.isTypeSupported(c)) return c;
  return "";
}

/** Jednorazowy test dostępu do mikrofonu (załadunek — zgoda PRZED spacerem). */
export async function checkMicPermission(): Promise<boolean> {
  if (!recordingSupported()) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return true;
  } catch {
    return false;
  }
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private mime = "";

  get active(): boolean {
    return this.recorder !== null;
  }

  async start(): Promise<void> {
    if (this.recorder) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mime = pickMime();
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, this.mime ? { mimeType: this.mime } : undefined);
    this.recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) this.chunks.push(ev.data);
    };
    this.recorder.start();
  }

  /** Zatrzymuje i zwraca nagranie; zwalnia mikrofon. */
  stop(): Promise<{ blob: Blob; mime: string } | null> {
    return new Promise((resolve) => {
      const rec = this.recorder;
      if (!rec) {
        resolve(null);
        return;
      }
      rec.onstop = () => {
        const mime = this.mime || "audio/webm";
        const blob = new Blob(this.chunks, { type: mime });
        this.cleanup();
        resolve(blob.size > 0 ? { blob, mime } : null);
      };
      rec.stop();
    });
  }

  cancel(): void {
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.cleanup();
  }

  private cleanup(): void {
    if (this.stream) for (const track of this.stream.getTracks()) track.stop();
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
  }
}
