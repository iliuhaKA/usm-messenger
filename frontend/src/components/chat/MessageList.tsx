import { Download, FileText } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { getFileUrl } from '../../api/files.api';
import { cn } from '../../utils/cn';
import type { Attachment, Message } from '../../types/message.types';
import { formatMessageTime } from '../../lib/format';
import { Avatar } from '../Avatar';

function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentBlock({ attachment, mine }: { attachment: Attachment; mine: boolean }) {
  const url = getFileUrl(attachment.fileId);
  if (!url) return null;

  if (isImage(attachment.mimeType)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img
          src={url}
          alt={attachment.fileName}
          className="max-h-72 max-w-full rounded-xl object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={attachment.fileName}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 transition-colors',
        mine ? 'bg-white/15 hover:bg-white/25' : 'bg-black/5 hover:bg-black/10'
      )}
    >
      <FileText className={cn('h-8 w-8 shrink-0', mine ? 'text-white/90' : 'text-primary')} />
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-sm font-medium', mine ? 'text-white' : 'text-text-main')}>
          {attachment.fileName}
        </div>
        <div className={cn('text-xs', mine ? 'text-white/80' : 'text-text-muted')}>
          {formatSize(attachment.sizeBytes)}
        </div>
      </div>
      <Download className={cn('h-4 w-4 shrink-0', mine ? 'text-white/90' : 'text-primary')} />
    </a>
  );
}

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
      <div className="flex flex-1 items-center justify-center text-text-muted">Загрузка сообщений…</div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const label = mine
            ? currentUserLabel
            : [m.senderFirstName, m.senderLastName].filter(Boolean).join(' ') || 'Пользователь';
          const time = formatMessageTime(m.createdAt);

          return (
            <div key={m.id} className={cn('flex gap-3', mine ? 'flex-row-reverse' : 'flex-row')}>
              <Avatar
                name={label}
                fileId={m.senderAvatarFileId}
                size="sm"
                className="mt-1"
              />
              <div className={cn('max-w-[min(100%,28rem)]', mine ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'mb-1 flex flex-wrap gap-x-2 text-xs text-text-muted',
                    mine ? 'justify-end' : 'justify-start'
                  )}
                >
                  <span className="font-medium text-text-main">{label}</span>
                  <span className="text-text-main">{time}</span>
                </div>
                <div
                  className={cn(
                    'flex flex-col gap-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                    mine
                      ? 'rounded-tr-sm bg-primary text-white'
                      : 'rounded-tl-sm bg-white text-text-main ring-1 ring-black/5'
                  )}
                >
                  {m.attachment && <AttachmentBlock attachment={m.attachment} mine={mine} />}
                  {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
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
