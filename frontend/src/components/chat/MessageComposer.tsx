import type { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { Mic, Paperclip, SendHorizontal, Smile, X } from 'lucide-react';
import { Suspense, lazy, useEffect, useRef, useState, type FormEvent } from 'react';

import { uploadAttachment } from '../../api/files.api';
import { useSendMessage } from '../../hooks/useMessages';
import { useAuthStore } from '../../store/authStore';
import type { Attachment } from '../../types/message.types';
import { useTypingPublisher } from './ChatStompBridge';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

export function MessageComposer({ chatId }: { chatId: number }) {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiAnchorRef = useRef<HTMLDivElement>(null);
  const send = useSendMessage(user?.id ?? null);
  const publishTyping = useTypingPublisher();

  useEffect(() => {
    if (!showEmoji) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!emojiAnchorRef.current?.contains(e.target as Node)) setShowEmoji(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEmoji(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showEmoji]);

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setText((t) => t + emoji);
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    publishTyping(chatId, next.trim().length > 0);
    requestAnimationFrame(() => {
      ta.focus();
      const caret = start + emoji.length;
      ta.setSelectionRange(caret, caret);
    });
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChosen = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const att = await uploadAttachment(file, chatId);
      setPending(att);
    } catch {
      /* axios interceptor покажет 401, остальные ошибки тихо */
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const t = text.trim();
    if (!t && !pending) return;
    send.mutate(
      { chatId, content: t, attachmentId: pending?.id ?? null },
      {
        onSuccess: () => {
          setText('');
          setPending(null);
        },
      }
    );
  };

  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-black/5 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {pending && (
          <div className="flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-sm">
            <span className="truncate flex-1">📎 {pending.fileName}</span>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded p-1 text-text-muted hover:bg-black/10"
              aria-label="Убрать файл"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-1 rounded-2xl border border-black/10 bg-[var(--color-chat-bg)] px-2 py-2 sm:gap-2">
          {/* Голос — только на широких экранах, чтобы не воровать место у textarea. */}
          <div ref={emojiAnchorRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className={
                'rounded-lg p-2 transition-colors ' +
                (showEmoji
                  ? 'bg-black/10 text-primary'
                  : 'text-text-muted hover:bg-black/5')
              }
              title="Эмодзи"
              aria-label="Эмодзи"
              aria-expanded={showEmoji}
            >
              <Smile className="h-5 w-5" />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full left-0 z-30 mb-2">
                <Suspense
                  fallback={
                    <div className="h-[400px] w-[340px] animate-pulse rounded-lg bg-black/5" />
                  }
                >
                  <EmojiPicker
                    onEmojiClick={(data: EmojiClickData) => insertEmoji(data.emoji)}
                    theme={'light' as Theme}
                    emojiStyle={'native' as EmojiStyle}
                    searchPlaceholder="Поиск эмодзи…"
                    width={340}
                    height={400}
                    lazyLoadEmojis
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                  />
                </Suspense>
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            rows={1}
            className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-text-muted"
            placeholder="Сообщение…"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.trim()) publishTyping(chatId, true);
              else publishTyping(chatId, false);
            }}
            onBlur={() => publishTyping(chatId, false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
          />
          <button
            type="button"
            disabled
            className="hidden rounded-lg p-2 text-text-muted opacity-50 lg:inline-flex"
            title="В разработке"
            aria-label="Голосовое"
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onPickFile}
            disabled={uploading}
            className="rounded-lg p-2 text-text-muted hover:bg-black/5 disabled:opacity-50"
            aria-label="Прикрепить файл"
            title="Прикрепить файл"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => onFileChosen(e.target.files?.[0])}
          />
          <button
            type="submit"
            disabled={(!text.trim() && !pending) || send.isPending || uploading}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white whitespace-nowrap hover:opacity-90 disabled:opacity-50 sm:px-4"
            aria-label="Отправить"
            title="Отправить"
          >
            <SendHorizontal className="h-4 w-4" />
            {/* Подпись скрыта на узком экране, чтобы не ломать вёрстку при двух окнах рядом. */}
            <span className="hidden md:inline">{uploading ? 'Загрузка…' : 'Отправить'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
