ALTER TABLE chats_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP;

UPDATE chats_members SET last_read_at = CURRENT_TIMESTAMP WHERE last_read_at IS NULL;
