import { X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateChat } from '../../hooks/useChats';
import { useUserSearch } from '../../hooks/useUserSearch';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';
import type { ChatType } from '../../types/chat.types';

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
      /* axios shows 401 via interceptor */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat nou</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-black/5" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium">Nume</label>
        <input
          className="mb-4 w-full rounded-xl border border-black/15 px-3 py-2 outline-none ring-primary focus:ring-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. Grupa IA2403"
        />

        <label className="mb-2 block text-sm font-medium">Tip</label>
        <select
          className="mb-4 w-full rounded-xl border border-black/15 px-3 py-2 outline-none"
          value={type}
          onChange={(e) => setType(e.target.value as ChatType)}
        >
          <option value="GROUP">GROUP</option>
          <option value="DIRECT">DIRECT</option>
          <option value="CHANNEL">CHANNEL</option>
        </select>

        <label className="mb-2 block text-sm font-medium">Adaugă participanți</label>
        <input
          className="mb-2 w-full rounded-xl border border-black/15 px-3 py-2 outline-none ring-primary focus:ring-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută după nume (min. 2 caractere)"
        />

        <ul className="mb-4 max-h-40 overflow-y-auto rounded-xl border border-black/10">
          {users?.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => toggleMember(u.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5',
                  memberIds.includes(u.id) && 'bg-primary/10'
                )}
              >
                <span className="font-medium">
                  {u.firstName} {u.lastName}
                </span>
                <span className="text-xs text-text-muted">{u.email}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!name.trim() || create.isPending}
          className="w-full rounded-xl bg-primary py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {create.isPending ? 'Se creează…' : 'Creează'}
        </button>
      </div>
    </div>
  );
}
