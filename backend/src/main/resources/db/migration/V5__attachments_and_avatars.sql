-- Перестраиваем attachments под GridFS:
-- file_url больше не нужен (бинарь в Mongo), вместо него gridfs_id (ObjectId).
ALTER TABLE attachments DROP COLUMN IF EXISTS file_url;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS gridfs_id VARCHAR(24);
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attachments ALTER COLUMN message_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attachments_gridfs ON attachments(gridfs_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);

-- Связь сообщения и вложения через FK на attachments.id (привязка после загрузки файла).
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_id BIGINT REFERENCES attachments(id);
CREATE INDEX IF NOT EXISTS idx_messages_attachment_id ON messages(attachment_id);

-- Аватары храним как ObjectId Mongo-документа в GridFS.
-- avatar_url оставляем как опциональный fallback (внешний URL).
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file_id VARCHAR(24);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS avatar_file_id VARCHAR(24);
