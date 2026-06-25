import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'stopped' | 'denied' | 'unsupported';

export interface RecordedAudio {
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
}

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const t of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return null;
}

/**
 * Запись с микрофона + усреднённые уровни громкости для рисования
 * live-waveform во время записи. Один источник истины для UI композера.
 */
export function useVoiceRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [result, setResult] = useState<RecordedAudio | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const mimeRef = useRef<string>('audio/webm');
  const cancelledRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [cleanup, result?.url]);

  const reset = useCallback(() => {
    cleanup();
    if (result?.url) URL.revokeObjectURL(result.url);
    setStatus('idle');
    setError(null);
    setElapsedMs(0);
    setLevels([]);
    setResult(null);
    chunksRef.current = [];
    cancelledRef.current = false;
  }, [cleanup, result?.url]);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      setError('Микрофон недоступен в этом браузере');
      return;
    }
    const mime = pickMimeType();
    if (!mime) {
      setStatus('unsupported');
      setError('Формат записи не поддерживается');
      return;
    }
    setStatus('requesting');
    setError(null);
    setElapsedMs(0);
    setLevels([]);
    setResult(null);
    chunksRef.current = [];
    cancelledRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus('denied');
      setError('Доступ к микрофону запрещён');
      return;
    }
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = recorder;
    mimeRef.current = mime;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const durationMs = Date.now() - startedAtRef.current;
      const wasCancelled = cancelledRef.current;
      cleanup();
      if (wasCancelled) {
        chunksRef.current = [];
        setStatus('idle');
        setElapsedMs(0);
        setLevels([]);
        return;
      }
      const blob = new Blob(chunksRef.current, { type: mimeRef.current });
      chunksRef.current = [];
      const url = URL.createObjectURL(blob);
      setResult({ blob, url, mimeType: mimeRef.current, durationMs });
      setStatus('stopped');
    };

    const AudioCtx: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtx();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;

    const buf = new Uint8Array(analyser.fftSize);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const level = Math.min(1, rms * 2.2);
      setLevels((prev) => {
        const next = prev.length >= 60 ? prev.slice(prev.length - 59) : prev.slice();
        next.push(level);
        return next;
      });
      setElapsedMs(Date.now() - startedAtRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    startedAtRef.current = Date.now();
    setStatus('recording');
    recorder.start(100);
    rafRef.current = requestAnimationFrame(tick);
  }, [cleanup]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      cancelledRef.current = false;
      recorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      cancelledRef.current = true;
      recorderRef.current.stop();
    } else {
      reset();
    }
  }, [reset]);

  return { status, error, elapsedMs, levels, result, start, stop, cancel, reset };
}
