-- Поддержка голосовых сообщений: длительность аудио в миллисекундах.
-- Поле опционально и применимо к любым audio-вложениям, но в первую очередь
-- используется для записей с purpose=VOICE в file_metadata (Mongo).
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS duration_ms BIGINT;
