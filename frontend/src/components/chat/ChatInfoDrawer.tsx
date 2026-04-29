import { useQueryClient } from '@tanstack/react-query';
import { Camera, LogOut, Pencil, Pin, Plus, Trash2, UserMinus, VolumeX, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  addChatMember,
  deleteChat,
  muteChat,
  pinChat,
  removeChatMember,
  setChatAvatar,
  updateChat,
} from '../../api/chats.api';
import { uploadChatAvatar } from '../../api/files.api';
import { fetchPresence } from '../../api/presence.api';
import { searchUsers } from '../../api/users.api';
import { useAuthStore } from '../../store/authStore';
import { usePresenceStore } from '../../store/presenceStore';
import type { ChatDetail, ChatMemberPreview } from '../../types/chat.types';
import type { User } from '../../types/user.types';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';

export function ChatInfoDrawer({
  chat,
  open,
  onClose,
}: {
  chat: ChatDetail | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const setStatuses = usePresenceStore((s) => s.setStatuses);

  const myMember = chat?.members.find((m) => m.id === me?.id);
  const isAdmin = myMember?.chatRole === 'ADMIN';

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(chat?.name ?? '');
  const [description, setDescription] = useState(chat?.description ?? '');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chat) {
      setName(chat.name);
      setDescription(chat.description ?? '');
    }
  }, [chat?.id, chat?.name, chat?.description]);

  useEffect(() => {
    if (!open || !chat) return;
    const ids = chat.members.map((m) => m.id);
    if (ids.length === 0) return;
    fetchPresence(ids)
      .then(setStatuses)
      .catch(() => undefined);
  }, [open, chat?.id, chat?.members, setStatuses]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = window.setTimeout(() => {
      searchUsers(search.trim())
        .then((r) => {
          if (!cancelled) setSearchResults(r);
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [search]);

  if (!open || !chat) return null;

  const memberIds = new Set(chat.members.map((m) => m.id));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['chat', chat.id] });
    qc.invalidateQueries({ queryKey: ['chats', me?.id] });
  };

  const onAvatarPick = () => fileRef.current?.click();
  const onAvatarChosen = async (file: File | undefined) => {
    if (!file || !isAdmin) return;
    setBusy(true);
    try {
      const fileId = await uploadChatAvatar(chat.id, file);
      await setChatAvatar(chat.id, fileId);
      refresh();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSaveEdit = async () => {
    if (!isAdmin) return;
    setBusy(true);
    try {
      await updateChat(chat.id, { name: name.trim(), description: description.trim() });
      refresh();
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const onAdd = async (userId: number) => {
    if (!isAdmin) return;
    setBusy(true);
    try {
      await addChatMember(chat.id, userId);
      setSearch('');
      setSearchResults([]);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (userId: number) => {
    if (!isAdmin || !window.confirm('Удалить участника из чата?')) return;
    setBusy(true);
    try {
      await removeChatMember(chat.id, userId);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const onLeave = async () => {
    if (!me || !window.confirm('Выйти из чата?')) return;
    setBusy(true);
    try {
      await removeChatMember(chat.id, me.id);
      qc.invalidateQueries({ queryKey: ['chats', me.id] });
      navigate('/chat', { replace: true });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!isAdmin || !window.confirm('Удалить чат для всех участников? Это действие необратимо.')) return;
    setBusy(true);
    try {
      await deleteChat(chat.id);
      qc.invalidateQueries({ queryKey: ['chats', me?.id] });
      navigate('/chat', { replace: true });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const togglePin = async () => {
    setBusy(true);
    try {
      await pinChat(chat.id, !chat.isPinned);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const toggleMute = async () => {
    setBusy(true);
    try {
      await muteChat(chat.id, !chat.isMuted);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className="absolute inset-0 z-30 bg-black/30 animate-fade-in"
        onClick={onClose}
        aria-label="Закрыть"
      />
      <aside className="absolute right-0 top-0 z-40 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-black/5 bg-white shadow-xl animate-slide-in-right">
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 px-4 py-3">
          <h2 className="font-semibold text-text-main">Информация о чате</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-black/5"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-4 py-5">
          <div className="mb-4 flex flex-col items-center text-center">
            <button
              type="button"
              disabled={!isAdmin || busy}
              onClick={onAvatarPick}
              className="group relative"
              aria-label="Изменить аватар"
            >
              <Avatar
                name={chat.name}
                fileId={chat.avatarFileId}
                url={chat.avatarUrl}
                size="xl"
              />
              {isAdmin && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6" />
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onAvatarChosen(e.target.files?.[0])}
            />

            {!editing ? (
              <>
                <h3 className="mt-3 text-lg font-semibold text-text-main">{chat.name}</h3>
                {chat.description && (
                  <p className="mt-1 text-sm text-text-muted">{chat.description}</p>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    Редактировать
                  </button>
                )}
              </>
            ) : (
              <div className="mt-3 w-full space-y-2">
                <input
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Название"
                />
                <textarea
                  rows={2}
                  className="w-full resize-none rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Описание"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onSaveEdit}
                    disabled={busy || !name.trim()}
                    className="flex-1 rounded-xl bg-primary py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setName(chat.name);
                      setDescription(chat.description ?? '');
                    }}
                    className="flex-1 rounded-xl bg-black/5 py-2 text-sm text-text-main hover:bg-black/10"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={togglePin}
              disabled={busy}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors',
                chat.isPinned
                  ? 'bg-primary/10 text-primary'
                  : 'bg-black/5 text-text-main hover:bg-black/10'
              )}
            >
              <Pin className="h-4 w-4" />
              {chat.isPinned ? 'Откреплён' : 'Закрепить'}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              disabled={busy}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors',
                chat.isMuted
                  ? 'bg-primary/10 text-primary'
                  : 'bg-black/5 text-text-main hover:bg-black/10'
              )}
            >
              <VolumeX className="h-4 w-4" />
              {chat.isMuted ? 'Звук выкл.' : 'Без звука'}
            </button>
          </div>
        </div>

        <div className="border-t border-black/5 px-4 py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Участники ({chat.members.length})
          </h4>

          {isAdmin && (
            <div className="mb-3">
              <input
                type="search"
                placeholder="Добавить участника (поиск по имени)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              />
              {searching && <p className="mt-1 text-xs text-text-muted">Поиск…</p>}
              {searchResults.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-black/10">
                  {searchResults
                    .filter((u) => !memberIds.has(u.id))
                    .map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => onAdd(u.id)}
                          disabled={busy}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-50"
                        >
                          <Avatar
                            name={`${u.firstName} ${u.lastName}`}
                            fileId={u.avatarFileId}
                            url={u.avatarUrl}
                            size="sm"
                          />
                          <span className="flex-1">
                            {u.firstName} {u.lastName}
                          </span>
                          <Plus className="h-4 w-4 text-primary" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          <ul className="flex flex-col gap-1">
            {chat.members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isMe={m.id === me?.id}
                canRemove={isAdmin && m.id !== me?.id}
                onRemove={() => onRemove(m.id)}
              />
            ))}
          </ul>
        </div>

        <div className="mt-auto border-t border-black/5 px-4 py-4">
          <button
            type="button"
            onClick={onLeave}
            disabled={busy}
            className="mb-2 flex w-full items-center gap-2 rounded-xl bg-black/5 px-4 py-3 text-sm text-text-main hover:bg-black/10 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            Выйти из чата
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="flex w-full items-center gap-2 rounded-xl border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-sm text-accent-red hover:bg-accent-red/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Удалить чат
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function MemberRow({
  member,
  isMe,
  canRemove,
  onRemove,
}: {
  member: ChatMemberPreview;
  isMe: boolean;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const online = usePresenceStore((s) => s.statuses.get(member.id) === 'ONLINE');
  const fullName = useMemo(
    () => `${member.firstName} ${member.lastName}`.trim(),
    [member.firstName, member.lastName]
  );

  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-black/5">
      <Avatar
        name={fullName}
        fileId={member.avatarFileId}
        url={member.avatarUrl}
        size="md"
        online={online}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-text-main">
            {fullName}
            {isMe && <span className="ml-1 text-xs text-text-muted">(вы)</span>}
          </span>
          {member.chatRole === 'ADMIN' && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              админ
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted">{online ? 'онлайн' : 'офлайн'}</div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-text-muted hover:bg-accent-red/10 hover:text-accent-red"
          aria-label="Удалить"
          title="Удалить из чата"
        >
          <UserMinus className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
