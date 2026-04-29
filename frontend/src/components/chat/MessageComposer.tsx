import { Mic, Paperclip, SendHorizontal, Smile, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';

import { uploadAttachment } from '../../api/files.api';
import { useSendMessage } from '../../hooks/useMessages';
import { useAuthStore } from '../../store/authStore';
import type { Attachment } from '../../types/message.types';

export function MessageComposer({ chatId }: { chatId: number }) {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const send = useSendMessage(user?.id ?? null);

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
        <div className="flex items-end gap-2 rounded-2xl border border-black/10 bg-[var(--color-chat-bg)] px-2 py-2">
          <button
            type="button"
            disabled
            className="rounded-lg p-2 text-text-muted opacity-50"
            title="В разработке"
            aria-label="Эмодзи"
          >
            <Smile className="h-5 w-5" />
          </button>
          <textarea
            rows={1}
            className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-text-muted"
            placeholder="Введите сообщение…"
            value={text}
            onChange={(e) => setText(e.target.value)}
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
            className="rounded-lg p-2 text-text-muted opacity-50"
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
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <SendHorizontal className="h-4 w-4" />
            {uploading ? 'Загрузка…' : 'Отправить'}
          </button>
        </div>
      </div>
    </form>
  );
}
