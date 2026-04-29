export interface Attachment {
  id: number;
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: number | null;
}

export interface Message {
  id: number;
  chatId: number;
  senderId: number | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  senderAvatarFileId: string | null;
  content: string | null;
  createdAt: string;
  attachment: Attachment | null;
}
