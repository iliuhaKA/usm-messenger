import { axiosInstance } from './axios';

import type { Message } from '../types/message.types';

export async function fetchMessages(chatId: number, userId: number): Promise<Message[]> {
  const { data } = await axiosInstance.get<Message[]>(`/chats/${chatId}/messages`, {
    params: { userId },
  });
  return data;
}

export async function sendMessage(
  chatId: number,
  userId: number,
  content: string
): Promise<Message> {
  const { data } = await axiosInstance.post<Message>(
    `/chats/${chatId}/messages`,
    { content },
    { params: { userId } }
  );
  return data;
}
