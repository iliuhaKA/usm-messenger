export type ChatType = 'GROUP' | 'DIRECT' | 'CHANNEL';

export interface ChatListItem {
  id: number;
  name: string;
  type: ChatType;
  avatarUrl?: string | null;
  avatarFileId?: string | null;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  memberCount: number;
}

export interface ChatMemberPreview {
  id: number;
  idnp?: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  /** Роль в данном чате: ADMIN | MEMBER. Заполняется только когда юзер выдаётся как член чата. */
  chatRole?: string | null;
  avatarUrl?: string | null;
  avatarFileId?: string | null;
  lastSeen?: string | null;
}

export interface ChatDetail {
  id: number;
  name: string;
  type: ChatType;
  description?: string | null;
  avatarUrl?: string | null;
  avatarFileId?: string | null;
  createdAt: string;
  memberCount: number;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  members: ChatMemberPreview[];
}

export interface CreateChatPayload {
  name: string;
  type: ChatType;
  description?: string;
  memberIds: number[];
}
