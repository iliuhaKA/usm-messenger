import { axiosInstance } from './axios';

import type { ChatDetail, ChatListItem, CreateChatPayload } from '../types/chat.types';

function mapListItem(raw: Record<string, unknown>): ChatListItem {
  return {
    id: Number(raw.id),
    name: String(raw.name),
    type: raw.type as ChatListItem['type'],
    avatarUrl: (raw.avatarUrl as string) ?? null,
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
    createdAt: String(raw.createdAt),
    memberCount: Number(raw.memberCount ?? 0),
    unreadCount: Number(raw.unreadCount ?? 0),
    isPinned: Boolean(raw.isPinned ?? raw.pinned),
    isMuted: Boolean(raw.isMuted ?? raw.muted),
    members: Array.isArray(raw.members) ? (raw.members as ChatDetail['members']) : [],
  };
}

export async function fetchChats(userId: number): Promise<ChatListItem[]> {
  const { data } = await axiosInstance.get<Record<string, unknown>[]>('/chats', { params: { userId } });
  return data.map(mapListItem);
}

export async function fetchChat(chatId: number, userId: number): Promise<ChatDetail> {
  const { data } = await axiosInstance.get<Record<string, unknown>>(`/chats/${chatId}`, { params: { userId } });
  return mapChatDetail(data);
}

export async function createChat(userId: number, body: CreateChatPayload): Promise<ChatDetail> {
  const { data } = await axiosInstance.post<Record<string, unknown>>('/chats', body, { params: { userId } });
  return mapChatDetail(data);
}

export async function pinChat(chatId: number, userId: number, pinned: boolean): Promise<void> {
  await axiosInstance.patch(`/chats/${chatId}/pin`, { pinned }, { params: { userId } });
}

export async function muteChat(chatId: number, userId: number, muted: boolean): Promise<void> {
  await axiosInstance.patch(`/chats/${chatId}/mute`, { muted }, { params: { userId } });
}

export async function markChatRead(chatId: number, userId: number): Promise<void> {
  await axiosInstance.post(`/chats/${chatId}/read`, {}, { params: { userId } });
}
