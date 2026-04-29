import { axiosInstance } from './axios';

import type { Message } from '../types/message.types';

export async function fetchMessages(chatId: number): Promise<Message[]> {
  const { data } = await axiosInstance.get<Message[]>(`/chats/${chatId}/messages`);
  return data;
}

export async function sendMessage(
  chatId: number,
  content: string,
  attachmentId?: number | null
): Promise<Message> {
  const { data } = await axiosInstance.post<Message>(`/chats/${chatId}/messages`, {
    content,
    attachmentId: attachmentId ?? null,
  });
  return data;
}
