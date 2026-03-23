import { useEffect, useRef } from 'react';

import { cn } from '../../utils/cn';
import type { Message } from '../../types/message.types';
import { formatMessageTime } from '../../lib/format';

export function MessageList({
  messages,
  currentUserId,
  currentUserLabel,
  loading,
}: {
  messages: Message[];
  currentUserId: number;
  currentUserLabel: string;
  loading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-text-muted">Se încarcă mesajele…</div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const label = mine
            ? currentUserLabel
            : [m.senderFirstName, m.senderLastName].filter(Boolean).join(' ') || 'Utilizator';
          const time = formatMessageTime(m.createdAt);

          return (
            <div
              key={m.id}
              className={cn('flex gap-3', mine ? 'flex-row-reverse' : 'flex-row')}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                  mine ? 'bg-primary text-white' : 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                )}
              >
                {(mine ? 'T' : label.slice(0, 1)).toUpperCase()}
              </div>
              <div className={cn('max-w-[min(100%,28rem)]', mine ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'mb-1 flex flex-wrap gap-x-2 text-xs text-text-muted',
                    mine ? 'justify-end' : 'justify-start'
                  )}
                >
                  <span className="font-medium text-text-main">{label}</span>
                  <span>{time}</span>
                </div>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                    mine ? 'rounded-tr-sm bg-primary text-white' : 'rounded-tl-sm bg-white text-text-main ring-1 ring-black/5'
                  )}
                >
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
