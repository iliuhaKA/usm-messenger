import { MoreVertical } from 'lucide-react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { MessageComposer } from '../components/chat/MessageComposer';
import { MessageList } from '../components/chat/MessageList';
import { useChat } from '../hooks/useChats';
import { useMarkChatRead } from '../hooks/useMarkChatRead';
import { useMessages } from '../hooks/useMessages';
import { useAuthStore } from '../store/authStore';

export function ChatPage() {
  const { chatId: chatIdParam } = useParams();
  const user = useAuthStore((s) => s.user);
  const chatId = chatIdParam ? Number(chatIdParam) : NaN;
  const valid = Number.isFinite(chatId);

  const { mutate: markChatOpened } = useMarkChatRead(user?.id ?? null);

  const { data: chat, isLoading: chatLoading } = useChat(valid ? chatId : null, user?.id ?? null);
  const { data: messages, isLoading: msgLoading } = useMessages(valid ? chatId : null, user?.id ?? null);

  useEffect(() => {
    if (!valid || !user?.id) return;
    markChatOpened(chatId);
  }, [valid, chatId, user?.id, markChatOpened]);

  if (!valid) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-text-muted">
        <div>
          <p className="text-lg font-medium text-text-main">Выберите чат</p>
          <p className="mt-2 text-sm">Выберите один из доступных чатов в списке</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/Friren.jpg')",
          filter: 'blur(6px)',
        }}
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
            {chat?.name?.slice(0, 1).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-text-main">{chatLoading ? '…' : chat?.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Онлайн
            </p>
          </div>
          <button type="button" className="rounded-lg p-2 hover:bg-black/5" aria-label="Menu">
            <MoreVertical className="h-5 w-5 text-text-muted" />
          </button>
        </header>

        <MessageList
          messages={messages ?? []}
          currentUserId={user?.id ?? 0}
          currentUserLabel={
            user ? `${user.firstName} ${user.lastName}`.trim() : 'Tu'
          }
          loading={msgLoading}
        />

        <MessageComposer chatId={chatId} />
      </div>
    </div>
  );
}
