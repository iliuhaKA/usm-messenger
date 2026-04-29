import { MoreVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Avatar } from '../components/Avatar';
import { ChatInfoDrawer } from '../components/chat/ChatInfoDrawer';
import { MessageComposer } from '../components/chat/MessageComposer';
import { MessageList } from '../components/chat/MessageList';
import { NoChatSelected } from '../components/empty/EmptyStates';
import { useChat } from '../hooks/useChats';
import { useMarkChatRead } from '../hooks/useMarkChatRead';
import { useMessages } from '../hooks/useMessages';
import { useAuthStore } from '../store/authStore';
import { usePresenceStore } from '../store/presenceStore';

export function ChatPage() {
  const { chatId: chatIdParam } = useParams();
  const user = useAuthStore((s) => s.user);
  const chatId = chatIdParam ? Number(chatIdParam) : NaN;
  const valid = Number.isFinite(chatId);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { mutate: markChatOpened } = useMarkChatRead(user?.id ?? null);

  const { data: chat, isLoading: chatLoading } = useChat(valid ? chatId : null, user?.id ?? null);
  const { data: messages, isLoading: msgLoading } = useMessages(valid ? chatId : null, user?.id ?? null);

  const typingMap = usePresenceStore((s) => s.typing);
  const typingNames = useMemo(() => {
    if (!chat || !user) return [];
    const ids = typingMap.get(chatId);
    if (!ids || ids.size === 0) return [];
    return chat.members
      .filter((m) => ids.has(m.id) && m.id !== user.id)
      .map((m) => `${m.firstName} ${m.lastName}`.trim());
  }, [chat, user, typingMap, chatId]);

  useEffect(() => {
    if (!valid || !user?.id) return;
    markChatOpened(chatId);
  }, [valid, chatId, user?.id, markChatOpened]);

  // Закрыть drawer при переключении чата.
  useEffect(() => {
    setDrawerOpen(false);
  }, [chatId]);

  if (!valid) {
    return <NoChatSelected />;
  }

  const subtitle =
    typingNames.length > 0
      ? typingNames.length === 1
        ? `${typingNames[0]} печатает…`
        : 'Несколько пользователей печатают…'
      : `${chat?.memberCount ?? 0} ${chat?.memberCount === 1 ? 'участник' : 'участников'}`;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-chat-bg)]">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 -m-1 text-left hover:bg-black/5"
            aria-label="Информация о чате"
          >
            <Avatar
              name={chat?.name ?? '?'}
              fileId={chat?.avatarFileId}
              url={chat?.avatarUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-semibold text-text-main">
                {chatLoading ? '…' : chat?.name}
              </h1>
              <p
                className={
                  typingNames.length > 0 ? 'text-sm text-primary' : 'text-sm text-text-muted'
                }
              >
                {subtitle}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 hover:bg-black/5"
            aria-label="Меню"
          >
            <MoreVertical className="h-5 w-5 text-text-muted" />
          </button>
        </header>

        <MessageList
          messages={messages ?? []}
          currentUserId={user?.id ?? 0}
          currentUserLabel={user ? `${user.firstName} ${user.lastName}`.trim() : 'Я'}
          loading={msgLoading}
        />

        <MessageComposer chatId={chatId} />
      </div>

      <ChatInfoDrawer chat={chat} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
