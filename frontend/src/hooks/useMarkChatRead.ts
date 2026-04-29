import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markChatRead } from '../api/chats.api';

export function useMarkChatRead(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: number) => markChatRead(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chats', userId] });
    },
  });
}
