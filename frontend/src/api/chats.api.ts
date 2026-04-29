import { axiosInstance } from './axios';

import type { ChatDetail, ChatListItem, CreateChatPayload } from '../types/chat.types';

function mapListItem(raw: Record<string, unknown>): ChatListItem {
  return {
    id: Number(raw.id),
    name: String(raw.name),
    type: raw.type as ChatListItem['type'],
    avatarUrl: (raw.avatarUrl as string) ?? null,
    avatarFileId: (raw.avatarFileId as string) ?? null,
    lastMessage: (raw.lastMessage as string) ?? null,
    lastMessageTime: (raw.lastMessageTime as string) ?? null,
    unreadCount: Number(raw.unreadCount ?? 0),
    isPinned: Boolean(raw.isPinned ?? raw.pinned),
    isMuted: Boolean(raw.isMuted ?? raw.muted),
    memberCount: Number(raw.memberCount ?? 0),
  };
}

function mapChatDetail(raw: Record<string, unknown>): ChatDetail {
  return {
    id: Number(raw.id),
    name: String(raw.name),
    type: raw.type as ChatDetail['type'],
    description: (raw.description as string) ?? null,
    avatarUrl: (raw.avatarUrl as string) ?? null,
    avatarFileId: (raw.avatarFileId as string) ?? null,
    createdAt: String(raw.createdAt),
    memberCount: Number(raw.memberCount ?? 0),
    unreadCount: Number(raw.unreadCount ?? 0),
    isPinned: Boolean(raw.isPinned ?? raw.pinned),
    isMuted: Boolean(raw.isMuted ?? raw.muted),
    members: Array.isArray(raw.members) ? (raw.members as ChatDetail['members']) : [],
  };
}

export async function fetchChats(): Promise<ChatListItem[]> {
  const { data } = await axiosInstance.get<Record<string, unknown>[]>('/chats');
  return data.map(mapListItem);
}

export async function fetchChat(chatId: number): Promise<ChatDetail> {
  const { data } = await axiosInstance.get<Record<string, unknown>>(`/chats/${chatId}`);
  return mapChatDetail(data);
}

export async function createChat(body: CreateChatPayload): Promise<ChatDetail> {
  const { data } = await axiosInstance.post<Record<string, unknown>>('/chats', body);
  return mapChatDetail(data);
}

export async function pinChat(chatId: number, pinned: boolean): Promise<void> {
  await axiosInstance.patch(`/chats/${chatId}/pin`, { pinned });
}

export async function muteChat(chatId: number, muted: boolean): Promise<void> {
  await axiosInstance.patch(`/chats/${chatId}/mute`, { muted });
}

export async function markChatRead(chatId: number): Promise<void> {
  await axiosInstance.post(`/chats/${chatId}/read`, {});
}

export async function updateChat(
  chatId: number,
  body: { name?: string; description?: string }
): Promise<ChatDetail> {
  const { data } = await axiosInstance.patch<Record<string, unknown>>(`/chats/${chatId}`, body);
  return mapChatDetail(data);
}

export async function setChatAvatar(chatId: number, fileId: string): Promise<ChatDetail> {
  const { data } = await axiosInstance.put<Record<string, unknown>>(
    `/chats/${chatId}/avatar`,
    null,
    { params: { fileId } }
  );
  return mapChatDetail(data);
}

export async function addChatMember(chatId: number, userId: number): Promise<void> {
  await axiosInstance.post(`/chats/${chatId}/members/${userId}`);
}

export async function removeChatMember(chatId: number, userId: number): Promise<void> {
  await axiosInstance.delete(`/chats/${chatId}/members/${userId}`);
}

export async function deleteChat(chatId: number): Promise<void> {
  await axiosInstance.delete(`/chats/${chatId}`);
}
