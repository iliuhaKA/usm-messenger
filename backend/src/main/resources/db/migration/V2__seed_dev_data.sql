INSERT INTO users (idnp, first_name, last_name, email, role, is_password_set)
VALUES
  ('2001123456789', 'Admin', 'USM', 'admin@usm.md', 'ADMIN', false),
  ('2002987654321', 'Ana', 'Popescu', 'ana.popescu@usm.md', 'STUDENT', false),
  ('2003111222333', 'Ion', 'Munteanu', 'ion.munteanu@usm.md', 'STUDENT', false),
  ('1990555666777', 'Victor', 'Ceban', 'victor.ceban@usm.md', 'TEACHER', false)
ON CONFLICT (idnp) DO NOTHING;

INSERT INTO chats (name, type, created_by, description)
VALUES
  ('Programare Web', 'GROUP', 1, 'Чат группы по веб-программированию'),
  ('Baze de Date', 'GROUP', 1, 'Чат группы по базам данных'),
  ('Matematica Discretă', 'GROUP', 1, 'Чат группы по дискретной математике'),
  ('Anunțuri Facultate', 'CHANNEL', 1, 'Объявления факультета');

INSERT INTO chats_members (user_id, chat_id, role)
VALUES
  (1, 1, 'ADMIN'), (2, 1, 'MEMBER'), (3, 1, 'MEMBER'), (4, 1, 'ADMIN'),
  (1, 2, 'ADMIN'), (2, 2, 'MEMBER'), (3, 2, 'MEMBER'),
  (2, 3, 'MEMBER'), (3, 3, 'MEMBER'), (4, 3, 'ADMIN'),
  (1, 4, 'ADMIN'), (2, 4, 'MEMBER'), (3, 4, 'MEMBER'), (4, 4, 'MEMBER')
ON CONFLICT (user_id, chat_id) DO NOTHING;