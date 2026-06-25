import type { Attachment, Message } from '../types/message.types';

function normalizeAttachment(raw: unknown): Attachment | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.id == null || o.fileId == null) return null;
  return {
    id: Number(o.id),
    fileId: String(o.fileId),
    fileName: String(o.fileName ?? ''),
    mimeType: String(o.mimeType ?? 'application/octet-stream'),
    sizeBytes: Number(o.sizeBytes ?? 0),
    uploadedById: o.uploadedById != null ? Number(o.uploadedById) : null,
    durationMs: o.durationMs != null ? Number(o.durationMs) : null,
  };
}

/** STOMP/MVC иногда отдают LocalDateTime массивом — приводим к Message. */
export function normalizeStompMessage(raw: unknown): Message | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  let createdAt: string;
  const ca = o.createdAt;
  if (Array.isArray(ca)) {
    const [y, mo, d, h = 0, mi = 0, s = 0, ns = 0] = ca.map((x) => Number(x));
    const dt = new Date(y, mo - 1, d, h, mi, s, Math.floor(Number(ns) / 1e6));
    createdAt = dt.toISOString();
  } else if (typeof ca === 'string') {
    createdAt = ca;
  } else {
    createdAt = new Date().toISOString();
  }

  return {
    id: Number(o.id),
    chatId: Number(o.chatId),
    senderId: o.senderId != null ? Number(o.senderId) : null,
    senderFirstName: o.senderFirstName != null ? String(o.senderFirstName) : null,
    senderLastName: o.senderLastName != null ? String(o.senderLastName) : null,
    senderAvatarFileId: o.senderAvatarFileId != null ? String(o.senderAvatarFileId) : null,
    content: o.content != null ? String(o.content) : null,
    createdAt,
    attachment: normalizeAttachment(o.attachment),
  };
}
