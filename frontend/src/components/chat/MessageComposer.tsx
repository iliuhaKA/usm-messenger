import { Mic, Paperclip, SendHorizontal, Smile } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { useSendMessage } from '../../hooks/useMessages';
import { useAuthStore } from '../../store/authStore';

export function MessageComposer({ chatId }: { chatId: number }) {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const send = useSendMessage(user?.id ?? null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !user) return;
    send.mutate(
      { chatId, content: t },
      {
        onSuccess: () => setText(''),
      }
    );
  };

  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 border-t border-black/5 bg-white px-4 py-3"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-black/10 bg-[var(--color-chat-bg)] px-2 py-2">
        <button
          type="button"
          className="rounded-lg p-2 text-text-muted hover:bg-black/5"
          aria-label="Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>
        <textarea
          rows={1}
          className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-text-muted"
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        <button type="button" className="rounded-lg p-2 text-text-muted hover:bg-black/5" aria-label="Voice">
          <Mic className="h-5 w-5" />
        </button>
        <button type="button" className="rounded-lg p-2 text-text-muted hover:bg-black/5" aria-label="Attach">
          <Paperclip className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={!text.trim() || send.isPending}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <SendHorizontal className="h-4 w-4" />
          Send
        </button>
      </div>
    </form>
  );
}
