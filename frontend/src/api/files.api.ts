import { axiosInstance } from './axios';

import type { Attachment } from '../types/message.types';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443/api';

export function getFileUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  return `${API_URL.replace(/\/$/, '')}/files/${fileId}`;
}

export async function uploadAttachment(file: File, chatId: number): Promise<Attachment> {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', String(chatId));
  const { data } = await axiosInstance.post<Attachment>('/files/attachments', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadVoiceMessage(
  file: File,
  chatId: number,
  durationMs: number
): Promise<Attachment> {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', String(chatId));
  form.append('durationMs', String(Math.max(0, Math.round(durationMs))));
  form.append('voice', 'true');
  const { data } = await axiosInstance.post<Attachment>('/files/attachments', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadUserAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await axiosInstance.post<string>('/files/avatars/user', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadChatAvatar(chatId: number, file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await axiosInstance.post<string>(`/files/avatars/chat/${chatId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listChatFiles(chatId: number): Promise<Attachment[]> {
  const { data } = await axiosInstance.get<Attachment[]>(`/files/chats/${chatId}`);
  return data;
}

export async function renameAttachment(attachmentId: number, fileName: string): Promise<Attachment> {
  const { data } = await axiosInstance.patch<Attachment>(`/files/${attachmentId}`, { fileName });
  return data;
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  await axiosInstance.delete(`/files/${attachmentId}`);
}
