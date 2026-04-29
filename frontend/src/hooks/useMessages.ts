import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchMessages, sendMessage } from '../api/messages.api';
import type { Message } from '../types/message.types';

const MSG_POLL_MS = Number(import.meta.env.VITE_MESSAGES_POLL_MS ?? '3500');

export function useMessages(chatId: number | null, userId: number | null) {
  return useQuery({
    queryKey: ['messages', chatId, userId],
    queryFn: () => fetchMessages(chatId!),
    enabled: chatId != null && userId != null,
    refetchInterval: Number.isFinite(MSG_POLL_MS) && MSG_POLL_MS > 0 ? MSG_POLL_MS : false,
    refetchOnWindowFocus: true,
  });
}

export function useSendMessage(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, content }: { chatId: number; content: string }) =>
      sendMessage(chatId, content),
    onSuccess: (msg, { chatId }) => {
      qc.setQueryData<Message[]>(['messages', chatId, userId!], (old) => {
        if (!old) return [msg];
        if (old.some((m) => m.id === msg.id)) return old;
        return [...old, msg];
      });
      qc.invalidateQueries({ queryKey: ['chats', userId] });
    },
  });
}
