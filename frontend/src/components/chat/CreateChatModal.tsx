import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateChat } from '../../hooks/useChats';
import { useUserSearch } from '../../hooks/useUserSearch';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';
import type { ChatType } from '../../types/chat.types';
import { Avatar } from '../Avatar';

const TYPE_LABELS: Record<ChatType, string> = {
  GROUP: 'Группа',
  DIRECT: 'Личный чат',
  CHANNEL: 'Канал',
};

export function CreateChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [type, setType] = useState<ChatType>('GROUP');
  const [search, setSearch] = useState('');
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const create = useCreateChat(user?.id ?? null);
  const { data: users } = useUserSearch(search);

  if (!open) return null;

  const toggleMember = (id: number) => {
    if (id === user?.id) return;
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (!user || !name.trim()) return;
    try {
      const chat = await create.mutateAsync({
        name: name.trim(),
        type,
        description: '',
        memberIds: [...memberIds, user.id].filter((v, i, a) => a.indexOf(v) === i),
      });
      setName('');
      setMemberIds([]);
      setSearch('');
      onClose();
      navigate(`/chat/${chat.id}`);
    } catch {
      /* axios interceptor обработает 401, остальные ошибки тихо */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-main">Новый чат</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-black/5"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium text-text-main">Название</label>
        <input
          className="mb-4 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Группа ИА2403"
        />

        <label className="mb-2 block text-sm font-medium text-text-main">Тип</label>
        <select
          className="mb-4 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none"
          value={type}
          onChange={(e) => setType(e.target.value as ChatType)}
        >
          {(['GROUP', 'DIRECT', 'CHANNEL'] as ChatType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-sm font-medium text-text-main">Добавить участников</label>
        <input
          className="mb-2 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени (от 2 символов)"
        />

        <ul className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-black/10">
          {users?.map((u) => {
            const selected = memberIds.includes(u.id);
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => toggleMember(u.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-black/5',
                    selected && 'bg-primary/10'
                  )}
                >
                  <Avatar
                    name={`${u.firstName} ${u.lastName}`}
                    fileId={u.avatarFileId}
                    url={u.avatarUrl}
                    size="sm"
                  />
                  <span className="flex-1 truncate">
                    <span className="font-medium text-text-main">
                      {u.firstName} {u.lastName}
                    </span>
                    {u.email && (
                      <span className="ml-2 text-xs text-text-muted">{u.email}</span>
                    )}
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
          {users?.length === 0 && search.trim().length >= 2 && (
            <li className="px-3 py-3 text-center text-xs text-text-muted">Никого не найдено</li>
          )}
        </ul>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!name.trim() || create.isPending}
          className="w-full rounded-xl bg-primary py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {create.isPending ? 'Создаём…' : 'Создать'}
        </button>
      </div>
    </div>
  );
}
