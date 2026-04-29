import { LogOut, MessageCircle, Pin, Plus, Search, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';

import { useLogout } from '../../hooks/useAuth';
import { useChats } from '../../hooks/useChats';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';
import type { ChatListItem } from '../../types/chat.types';
import { formatMessageTime } from '../../lib/format';
import { Avatar } from '../Avatar';
import { EmptyChats } from '../empty/EmptyStates';
import { ChatRowSkeleton } from '../ui/Skeleton';
import { CreateChatModal } from './CreateChatModal';

function ChatRow({ chat }: { chat: ChatListItem }) {
  const { chatId } = useParams();
  const active = chatId === String(chat.id);
  const preview = chat.lastMessage?.slice(0, 48) ?? '—';
  const time = formatMessageTime(chat.lastMessageTime ?? undefined);

  return (
    <NavLink
      to={`/chat/${chat.id}`}
      className={cn(
        'flex gap-3 rounded-xl px-3 py-2.5 transition-colors',
        active ? 'bg-[var(--color-chat-active)]' : 'hover:bg-black/5'
      )}
    >
      <Avatar name={chat.name} fileId={chat.avatarFileId} url={chat.avatarUrl} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate font-medium text-text-main">{chat.name}</span>
          <span className="shrink-0 text-xs text-text-muted">{time}</span>
        </div>
        <p className="truncate text-sm text-text-muted">{preview}</p>
      </div>
      {chat.unreadCount > 0 && (
        <span className="mt-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-red px-1 text-xs font-medium text-white">
          {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
        </span>
      )}
    </NavLink>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { data: chats, isLoading, isError } = useChats(user?.id ?? null);

  const filtered = useMemo(() => {
    if (!chats) return [];
    const s = q.trim().toLowerCase();
    if (!s) return chats;
    return chats.filter((c) => c.name.toLowerCase().includes(s));
  }, [chats, q]);

  const pinned = filtered.filter((c) => c.isPinned);
  const rest = filtered.filter((c) => !c.isPinned);

  return (
    <>
      <aside className="flex w-[min(100%,380px)] shrink-0 flex-col border-r border-black/5 bg-[var(--color-sidebar-bg)]">
        <div className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
              <img src="/usm.png" alt="USM logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="truncate text-lg font-semibold text-primary">USMessenger</span>
          </div>
          <Link
            to="/settings"
            className="rounded-lg p-2 text-text-muted hover:bg-black/5"
            title="Настройки"
            aria-label="Настройки"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>

        <div className="flex gap-2 px-3 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              placeholder="Поиск чатов…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-full border border-black/10 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-primary focus:ring-2"
            />
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow hover:opacity-90"
            aria-label="Новый чат"
            title="Новый чат"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {isLoading && (
            <div className="flex flex-col gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <ChatRowSkeleton key={i} />
              ))}
            </div>
          )}
          {isError && (
            <p className="px-3 py-6 text-center text-sm text-accent-red">Не удалось загрузить чаты</p>
          )}
          {!isLoading && !isError && chats?.length === 0 && (
            <EmptyChats onCreate={() => setModalOpen(true)} />
          )}

          {pinned.length > 0 && (
            <Section title="Закреплённые" icon={Pin}>
              {pinned.map((c) => (
                <ChatRow key={c.id} chat={c} />
              ))}
            </Section>
          )}

          {rest.length > 0 && (
            <Section title="Все сообщения" icon={MessageCircle}>
              {rest.map((c) => (
                <ChatRow key={c.id} chat={c} />
              ))}
            </Section>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 border-t border-black/5 bg-white/40 px-3 py-3">
            <Link
              to="/profile"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 hover:bg-black/5"
            >
              <Avatar
                name={`${user.firstName} ${user.lastName}`}
                fileId={user.avatarFileId}
                url={user.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-main">
                  {user.firstName} {user.lastName}
                </div>
                <div className="truncate text-xs text-text-muted">{user.role}</div>
              </div>
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-text-muted hover:bg-black/5"
              title="Выйти"
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSettled: () => navigate('/login', { replace: true }),
                });
              }}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </aside>

      <CreateChatModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
