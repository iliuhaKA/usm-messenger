-- Demo password for all seeded users: Demo123!
-- BCrypt (Spring BCryptPasswordEncoder)
UPDATE users SET password_hash = '$2a$10$d/bI4OucI5R7dvrIVjrxGumBkn6RoV/zqWv3TismR1J95bbLhth8.', is_password_set = TRUE
WHERE id IN (1, 2, 3, 4);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

INSERT INTO messages (chat_id, sender_id, content, type, created_at)
VALUES
  (1, 2, 'Bună ziua, am o întrebare la tema 3.', 'TEXT', NOW() - INTERVAL '2 hours'),
  (1, 4, 'Desigur, trimiteți detaliile pe email.', 'TEXT', NOW() - INTERVAL '1 hour 50 minutes'),
  (1, 3, 'Mulțumesc!', 'TEXT', NOW() - INTERVAL '1 hour'),
  (1, 1, 'Reamintesc: deadline proiect vineri.', 'TEXT', NOW() - INTERVAL '30 minutes');
