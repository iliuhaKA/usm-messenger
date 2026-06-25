import { Mic, Pause, Play, Send, Square, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getFileUrl } from '../../api/files.api';
import type { RecordedAudio } from '../../hooks/useVoiceRecorder';
import { cn } from '../../utils/cn';

const BAR_COUNT = 40;

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Превращает массив сэмплов произвольной длины в фиксированное число бакетов (peaks). */
function resampleToBars(samples: number[], bars: number): number[] {
  if (samples.length === 0) return new Array(bars).fill(0);
  const out: number[] = new Array(bars).fill(0);
  const step = samples.length / bars;
  for (let i = 0; i < bars; i++) {
    const start = Math.floor(i * step);
    const end = Math.max(start + 1, Math.floor((i + 1) * step));
    let peak = 0;
    for (let j = start; j < end && j < samples.length; j++) {
      if (samples[j] > peak) peak = samples[j];
    }
    out[i] = peak;
  }
  return out;
}

/** Декодирует аудио-Blob и возвращает массив peaks для отрисовки waveform. */
async function decodePeaks(blob: Blob, bars: number): Promise<number[]> {
  const AudioCtx: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const buf = await blob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    const channel = decoded.getChannelData(0);
    const block = Math.max(1, Math.floor(channel.length / bars));
    const peaks: number[] = new Array(bars).fill(0);
    for (let i = 0; i < bars; i++) {
      let peak = 0;
      const start = i * block;
      const end = Math.min(channel.length, start + block);
      for (let j = start; j < end; j++) {
        const v = Math.abs(channel[j]);
        if (v > peak) peak = v;
      }
      peaks[i] = peak;
    }
    const max = peaks.reduce((m, v) => (v > m ? v : m), 0);
    return max > 0 ? peaks.map((v) => v / max) : peaks;
  } finally {
    ctx.close().catch(() => {});
  }
}

/**
 * Полоски waveform. `progress` — доля проигранного [0..1], раскрашивает заполненные бары.
 * Если progress не задан, все бары идут одним цветом.
 */
function Bars({
  peaks,
  progress,
  color,
  activeColor,
  onSeek,
}: {
  peaks: number[];
  progress?: number;
  color: string;
  activeColor: string;
  onSeek?: (fraction: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const items = peaks.length > 0 ? peaks : new Array(BAR_COUNT).fill(0);
  const activeIdx = progress != null ? Math.floor(progress * items.length) : items.length;

  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(fraction);
  };

  return (
    <div
      ref={ref}
      onClick={handle}
      className={cn(
        'flex h-8 flex-1 items-center gap-[2px] overflow-hidden',
        onSeek ? 'cursor-pointer' : ''
      )}
    >
      {items.map((p, i) => {
        const h = Math.max(2, Math.round(p * 28));
        return (
          <span
            key={i}
            className="w-[3px] rounded-full transition-colors"
            style={{
              height: `${h}px`,
              background: i < activeIdx ? activeColor : color,
            }}
          />
        );
      })}
    </div>
  );
}

/** UI активной записи: live-уровни, таймер, кнопки «отмена/стоп». */
export function VoiceRecording({
  elapsedMs,
  levels,
  onStop,
  onCancel,
}: {
  elapsedMs: number;
  levels: number[];
  onStop: () => void;
  onCancel: () => void;
}) {
  const peaks = useMemo(() => resampleToBars(levels, BAR_COUNT), [levels]);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-3 py-2">
      <span
        className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"
        aria-hidden
      />
      <span className="font-mono text-sm tabular-nums text-red-700">
        {formatDuration(elapsedMs)}
      </span>
      <Bars peaks={peaks} color="rgb(252 165 165)" activeColor="rgb(220 38 38)" />
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg p-2 text-text-muted hover:bg-black/5"
        aria-label="Отменить запись"
        title="Отменить"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onStop}
        className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
        aria-label="Остановить запись"
        title="Остановить"
      >
        <Square className="h-4 w-4 fill-current" />
      </button>
    </div>
  );
}

/** UI превью записи: плеер с waveform + send/delete. */
export function VoicePreview({
  audio,
  uploading,
  onSend,
  onDiscard,
}: {
  audio: RecordedAudio;
  uploading: boolean;
  onSend: () => void;
  onDiscard: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMs, setCurrentMs] = useState(0);

  useEffect(() => {
    let alive = true;
    decodePeaks(audio.blob, BAR_COUNT)
      .then((p) => {
        if (alive) setPeaks(p);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [audio.blob]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  const seek = (fraction: number) => {
    const a = audioRef.current;
    if (!a) return;
    const dur = isFinite(a.duration) && a.duration > 0 ? a.duration : audio.durationMs / 1000;
    a.currentTime = dur * fraction;
    setProgress(fraction);
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    const dur = isFinite(a.duration) && a.duration > 0 ? a.duration : audio.durationMs / 1000;
    setProgress(dur > 0 ? a.currentTime / dur : 0);
    setCurrentMs(a.currentTime * 1000);
  };

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2">
      <audio
        ref={audioRef}
        src={audio.url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrentMs(0);
        }}
        onTimeUpdate={onTimeUpdate}
        preload="metadata"
      />
      <button
        type="button"
        onClick={toggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:opacity-90"
        aria-label={playing ? 'Пауза' : 'Воспроизвести'}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <Bars
        peaks={peaks}
        progress={progress}
        color="rgb(0 0 0 / 0.15)"
        activeColor="var(--color-primary, #2563eb)"
        onSeek={seek}
      />
      <span className="font-mono text-xs tabular-nums text-text-muted">
        {formatDuration(playing || currentMs > 0 ? currentMs : audio.durationMs)}
      </span>
      <button
        type="button"
        onClick={onDiscard}
        disabled={uploading}
        className="rounded-lg p-2 text-text-muted hover:bg-black/5 disabled:opacity-50"
        aria-label="Удалить запись"
        title="Удалить"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onSend}
        disabled={uploading}
        className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        aria-label="Отправить голосовое"
        title="Отправить"
      >
        {uploading ? (
          <Mic className="h-4 w-4 animate-pulse" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span className="hidden md:inline">{uploading ? 'Загрузка…' : 'Отправить'}</span>
      </button>
    </div>
  );
}

/** Плеер в ленте сообщений для уже отправленного голосового. */
export function VoiceMessagePlayer({
  fileId,
  durationMs,
  mine,
}: {
  fileId: string;
  durationMs: number | null;
  mine: boolean;
}) {
  const url = getFileUrl(fileId);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMs, setCurrentMs] = useState(0);
  const [totalMs, setTotalMs] = useState<number>(durationMs ?? 0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    (async () => {
      try {
        const resp = await fetch(url, { credentials: 'include' });
        if (!resp.ok) return;
        const blob = await resp.blob();
        const p = await decodePeaks(blob, BAR_COUNT);
        if (alive) setPeaks(p);
      } catch {
        /* при ошибке оставляем плоский waveform */
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);

  if (!url) return null;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  const seek = (fraction: number) => {
    const a = audioRef.current;
    if (!a) return;
    const dur = isFinite(a.duration) && a.duration > 0 ? a.duration : totalMs / 1000;
    if (dur <= 0) return;
    a.currentTime = dur * fraction;
    setProgress(fraction);
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    const dur = isFinite(a.duration) && a.duration > 0 ? a.duration : totalMs / 1000;
    setProgress(dur > 0 ? a.currentTime / dur : 0);
    setCurrentMs(a.currentTime * 1000);
  };

  const onLoaded = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isFinite(a.duration) && a.duration > 0 && (!totalMs || totalMs === 0)) {
      setTotalMs(a.duration * 1000);
    }
  };

  const display = playing || currentMs > 0 ? currentMs : totalMs;

  return (
    <div className="flex w-full items-center gap-2">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={onLoaded}
        onDurationChange={onLoaded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrentMs(0);
        }}
        onTimeUpdate={onTimeUpdate}
      />
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          mine
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-primary text-white hover:opacity-90'
        )}
        aria-label={playing ? 'Пауза' : 'Воспроизвести'}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <Bars
        peaks={peaks}
        progress={progress}
        color={mine ? 'rgb(255 255 255 / 0.35)' : 'rgb(0 0 0 / 0.18)'}
        activeColor={mine ? '#ffffff' : 'var(--color-primary, #2563eb)'}
        onSeek={seek}
      />
      <span
        className={cn(
          'font-mono text-xs tabular-nums',
          mine ? 'text-white/80' : 'text-text-muted'
        )}
      >
        {formatDuration(display)}
      </span>
    </div>
  );
}

export function isVoiceAttachment(att: {
  mimeType: string;
  durationMs: number | null;
}): boolean {
  return att.mimeType.startsWith('audio/') && att.durationMs != null;
}
