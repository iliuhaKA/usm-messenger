import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createChat, fetchChat, fetchChats, muteChat, pinChat } from '../api/chats.api';

const CHAT_LIST_POLL_MS = Number(import.meta.env.VITE_CHATS_POLL_MS ?? '5000');

export function useChats(userId: number | null) {
  return useQuery({
    queryKey: ['chats', userId],
    queryFn: () => fetchChats(),
    enabled: userId != null,
    refetchInterval: Number.isFinite(CHAT_LIST_POLL_MS) && CHAT_LIST_POLL_MS > 0 ? CHAT_LIST_POLL_MS : false,
    refetchOnWindowFocus: true,
  });
}

export function useChat(chatId: number | null, userId: number | null) {
  return useQuery({
    queryKey: ['chat', chatId, userId],
    queryFn: () => fetchChat(chatId!),
    enabled: chatId != null && userId != null,
  });
}

export function useCreateChat(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createChat>[0]) => createChat(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats', userId] }),
  });
}

export function usePinChat(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, pinned }: { chatId: number; pinned: boolean }) =>
      pinChat(chatId, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats', userId] }),
  });
}

export function useMuteChat(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, muted }: { chatId: number; muted: boolean }) =>
      muteChat(chatId, muted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats', userId] }),
  });
}
