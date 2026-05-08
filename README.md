# USMessenger

Веб-мессенджер для общения студентов и преподавателей Молдавского
государственного университета. Курсовая работа.

> Особенность реализации: многомодельная архитектура хранения данных —
> одновременное использование трёх типов СУБД (реляционная PostgreSQL,
> документная MongoDB с GridFS, in-memory key-value Redis), связанных
> между собой на уровне бизнес-логики.

---

## Содержание

1. [Описание проекта](#1-описание-проекта)
2. [Функциональные возможности](#2-функциональные-возможности)
3. [Архитектура и технологический стек](#3-архитектура-и-технологический-стек)
4. [Сценарии взаимодействия пользователей](#4-сценарии-взаимодействия-пользователей)
5. [Структура базы данных](#5-структура-базы-данных)
   - 5.1. [PostgreSQL — реляционная схема](#51-postgresql--реляционная-схема)
   - 5.2. [MongoDB и GridFS — документное хранилище файлов](#52-mongodb-и-gridfs--документное-хранилище-файлов)
   - 5.3. [Redis — in-memory кэш и состояние](#53-redis--in-memory-кэш-и-состояние)
   - 5.4. [Связка СУБД между собой](#54-связка-субд-между-собой)
6. [Безопасность](#6-безопасность)
7. [Примеры использования (фрагменты кода)](#7-примеры-использования-фрагменты-кода)
8. [Инструкция по запуску](#8-инструкция-по-запуску)
9. [Тестирование и проверка работы СУБД](#9-тестирование-и-проверка-работы-субд)
10. [Ответы на контрольные вопросы](#10-ответы-на-контрольные-вопросы)
11. [Список использованных источников](#11-список-использованных-источников)
12. [Структура репозитория](#12-структура-репозитория)

---

## 1. Описание проекта

### Формулировка задачи

Разработать веб-мессенджер для общения студентов и преподавателей USM —
полнофункциональное веб-приложение с серверной логикой, формами
взаимодействия, аутентификацией пользователей и ролевой моделью доступа.

Дополнительно — спроектировать систему хранения данных с применением
подхода **polyglot persistence** (выбор оптимальной СУБД под конкретный
класс задач): реляционные данные в PostgreSQL, бинарные файлы в MongoDB
GridFS, эфемерное состояние в Redis.

### Цели проекта

Спроектировать и реализовать веб-мессенджер, который:

- предоставляет пользователям интерфейс обмена текстовыми сообщениями
  и файлами в режиме реального времени;
- хранит структурированные данные (пользователи, чаты, сообщения)
  в реляционной СУБД;
- использует документную БД для бинарного содержимого (файловые вложения,
  аватары) с механизмом GridFS;
- использует in-memory key-value СУБД для быстрых эфемерных данных
  (онлайн-статусы, индикаторы набора, счётчики непрочитанных,
  активные JWT-сессии);
- обеспечивает целостность данных при работе нескольких СУБД одновременно —
  единая единица бизнес-логики (например, отправка сообщения с вложением)
  корректно затрагивает Postgres, MongoDB и Redis.

### Основные этапы разработки

1. Проектирование схемы данных и распределение ответственности между СУБД.
2. Разработка backend-приложения на Spring Boot с интеграцией трёх СУБД.
3. Разработка frontend-приложения на React/TypeScript.
4. Реализация JWT-аутентификации с серверным отзывом токенов через Redis.
5. Реализация WebSocket/STOMP для real-time-обмена сообщениями, индикаторов
   набора и онлайн-присутствия.
6. Контейнеризация всех компонентов через Docker Compose.
7. Тестирование сценариев и подготовка демонстрации.

---

## 2. Функциональные возможности

### Аутентификация и авторизация

- Регистрация и вход в систему по логину (IDNP или email) и паролю.
- Хеширование паролей по алгоритму **BCrypt** перед сохранением в БД.
- Выдача **JWT-токена** с подписью HMAC-SHA256 и уникальным `jti`.
- Серверный реестр активных сессий в Redis с TTL — позволяет принудительно
  отозвать токен при выходе из системы.
- Смена пароля авторизованным пользователем с обязательной проверкой текущего.

### Общедоступный компонент

- Страница входа `/login` доступна без авторизации.
- Health-check эндпоинт `GET /api/health` возвращает статус сервера.
- Эндпоинт скачивания аватаров `GET /api/files/{fileId}` публичный по
  модели security-by-obscurity (24-символьный криптостойкий ObjectId
  невозможно угадать).

### Защищённый компонент

После авторизации доступны:

- Список чатов пользователя с кэшированными счётчиками непрочитанных.
- Открытие конкретного чата, просмотр сообщений и вложений.
- Отправка текстовых сообщений и файлов произвольного типа.
- Real-time-уведомления о новых сообщениях, индикаторы набора текста,
  отображение онлайн-присутствия других пользователей.
- Создание новых чатов (групповых, личных, каналов).
- Управление профилем (имя, фамилия, email, аватар).
- Настройки уведомлений и выход из системы.

### Роль администратора чата

В рамках чата существуют две роли: `ADMIN` и `MEMBER`. Создатель чата
автоматически получает роль `ADMIN`. Администратору доступны
дополнительные функции (минимум 5, что покрывает требование 3–7
дополнительных функций):

1. Редактирование названия и описания чата.
2. Изменение аватара чата.
3. Добавление новых участников по результатам поиска.
4. Удаление участников из чата.
5. Удаление чата для всех участников (с каскадным удалением сообщений
   через FK `ON DELETE CASCADE`).
6. Назначение прав администратора (через прямую запись в БД для
   текущей версии; UI запланирован).

### Формы взаимодействия

Реализовано две основных формы, соответствующих требованиям задания.

**Форма создания ресурса** — модальное окно создания чата
([`CreateChatModal.tsx`](frontend/src/components/chat/CreateChatModal.tsx))
содержит шесть полей различного типа:

| № | Поле                  | Тип элемента          | Валидация                   |
|---|-----------------------|-----------------------|-----------------------------|
| 1 | Название чата         | `<input type="text">` | Не пустое, до 255 символов  |
| 2 | Тип чата              | `<select>`            | Одно из `GROUP/DIRECT/CHANNEL` |
| 3 | Описание              | `<textarea>`          | До 2000 символов            |
| 4 | Поиск участников      | `<input type="search">` | От 2 символов (debounce 300 мс) |
| 5 | Список выбранных      | `<button>`-checkbox   | Минимум 1 (создатель добавляется автоматически) |
| 6 | Подтверждение         | `<button type="submit">` | Серверная проверка членства и прав |

Валидация выполняется и на стороне клиента (до отправки), и на стороне
сервера через `jakarta.validation.constraints.*` в DTO. Ошибки
обрабатываются `GlobalExceptionHandler` и возвращаются с понятным
сообщением, отображаемым в интерфейсе.

**Форма поиска** реализована в двух местах:

- Поиск пользователей в интерфейсе создания чата и в `ChatInfoDrawer`
  (через REST-эндпоинт `GET /api/users/search?q={query}`,
  выполняющий ILIKE-поиск по имени и фамилии).
- Поиск чатов в боковой панели (клиентская фильтрация
  загруженного списка).

---

## 3. Архитектура и технологический стек

### Технологический стек

**Backend:**

- Java 21
- Spring Boot 4.0.2
- Spring Security 7 (JWT-аутентификация, BCrypt)
- Spring Data JPA / Hibernate 7 (работа с PostgreSQL)
- Spring Data MongoDB 5 (работа с MongoDB и GridFS)
- Spring Data Redis (Lettuce-клиент)
- Spring WebSocket / STOMP
- Flyway (миграции PostgreSQL)
- jjwt 0.12.6 (генерация и валидация JWT)
- Lombok
- Maven

**Frontend:**

- React 19 + TypeScript 5
- Vite 7 (сборка и dev-сервер)
- TanStack Query 5 (кэширование REST-запросов)
- Zustand 5 (управление состоянием авторизации и presence)
- @stomp/stompjs + sockjs-client (WebSocket-клиент)
- Tailwind CSS 4 (стили)
- React Router 7

**Хранилища данных:**

- PostgreSQL 16 (порт 5432)
- MongoDB 7 (порт 27017)
- Redis 7 (порт 6379)

**Инфраструктура:**

- Docker Compose (5 сервисов с healthcheck'ами и зависимостями)
- HTTPS на бэкенде (TLS 1.2/1.3, самоподписной сертификат, порт 8443)
- HTTPS на фронтенде через Nginx (порт 3000 → 443 в контейнере)
- WSS (WebSocket Secure) автоматически через SockJS/STOMP

### Архитектурный паттерн

Backend построен по схеме **MVC**, расширенной слоем DTO:

```
Controller (REST/WebSocket) → Service (бизнес-логика) → Repository (доступ к БД) → Entity
                                       ↓
                                DTO (Request/Response)
```

Принципиальное распределение ответственности по типам СУБД:

```
┌──────────────────────────────────────────────────────────────────┐
│                       Spring Boot Backend                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      Сервисы (Service)                       │ │
│  │   UserService  ChatService  MessageService  FileService     │ │
│  │   PresenceService  TypingService  UnreadCacheService        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│        ↓                       ↓                       ↓          │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │ JPA Repository│    │ Mongo Repository │    │ Redis Template│   │
│  └──────────────┘    └──────────────────┘    └──────────────┘   │
└────────↓──────────────────────↓──────────────────────↓──────────┘
         ↓                      ↓                      ↓
   ┌──────────┐          ┌────────────┐         ┌───────────┐
   │PostgreSQL│          │  MongoDB   │         │   Redis   │
   │структура │          │ файлы +    │         │ presence/ │
   │ + связи  │          │ метаданные │         │ TTL/sets  │
   └──────────┘          └────────────┘         └───────────┘
```

---

## 4. Сценарии взаимодействия пользователей

### Сценарий 1. Регистрация и первый вход

1. Пользователь открывает `https://localhost:3000` и попадает на форму
   входа `/login`.
2. Вводит логин (IDNP или email) и пароль из seed-данных
   (`Demo123!` для всех демо-пользователей).
3. Backend получает `POST /api/auth/login`, валидирует пароль через
   BCrypt, генерирует JWT-токен с уникальным `jti`, регистрирует
   сессию в Redis по ключу `jwt:session:{jti}` с TTL 24 часа.
4. Frontend сохраняет токен в Zustand-store (с persist в localStorage)
   и перенаправляет на `/chat`.

### Сценарий 2. Отправка текстового сообщения

1. Пользователь открывает чат, вводит текст и нажимает «Отправить».
2. Frontend выполняет `POST /api/chats/{id}/messages` с заголовком
   `Authorization: Bearer <token>`.
3. Backend проверяет членство пользователя в чате, шифрует тело
   сообщения алгоритмом AES-GCM, сохраняет запись в Postgres.
4. Для всех остальных участников чата инкрементируется счётчик
   непрочитанных в Redis (`unread:user:{userId}:chat:{chatId}`).
5. Сообщение публикуется в STOMP-топик `/topic/chats/{chatId}/messages`,
   все подписчики получают real-time-уведомление.

### Сценарий 3. Загрузка файла в чат (демонстрация связки трёх СУБД)

1. Пользователь нажимает на иконку скрепки и выбирает файл.
2. Frontend выполняет `POST /api/files/attachments` с multipart-формой.
3. Backend (`FileService.uploadAttachment`):
   - сохраняет бинарь в **MongoDB GridFS** (коллекции `fs.files` и
     `fs.chunks`), получает `ObjectId`;
   - создаёт документ в коллекции `file_metadata` с полями
     `gridfsId, ownerId, chatId, purpose=ATTACHMENT, mimeType, sizeBytes`;
   - создаёт запись в **PostgreSQL** в таблице `attachments` с тем же
     `gridfs_id` (это и есть «связка двух БД»);
   - возвращает клиенту `AttachmentResponse` с двумя идентификаторами.
4. Пользователь нажимает «Отправить». Frontend выполняет
   `POST /api/chats/{id}/messages` с `attachmentId`.
5. Backend связывает `messages.attachment_id` → `attachments.id`,
   шифрует текст (если есть), сохраняет, инкрементирует unread-счётчики
   в Redis, рассылает через WebSocket.
6. Получатели видят сообщение с превью изображения или карточкой файла.
   При клике браузер открывает `GET /api/files/{gridfsId}` —
   backend читает поток из GridFS и возвращает с правильным MIME-типом.

### Сценарий 4. Управление чатом администратором

1. Администратор открывает информацию о чате (клик по шапке).
2. Изменяет название/описание (форма) — `PATCH /api/chats/{id}`.
3. Загружает аватар чата — двухшаговый процесс: загрузка в GridFS
   с `purpose=AVATAR_CHAT`, затем `PUT /api/chats/{id}/avatar?fileId=…`.
4. Ищет нового участника — `GET /api/users/search?q=…`,
   `POST /api/chats/{id}/members/{userId}`.
5. Удаляет участника — `DELETE /api/chats/{id}/members/{userId}`.
6. Может удалить чат целиком — `DELETE /api/chats/{id}` с каскадом
   через FK `ON DELETE CASCADE`.

### Сценарий 5. Real-time индикаторы

1. При наборе текста frontend публикует STOMP-сообщение в
   `/app/chats/{id}/typing`.
2. Backend (`WebSocketController.typing`) обновляет
   `typing:chat:{id}` в Redis (SET с TTL 5s) и пересылает событие
   в `/topic/chats/{id}/typing`.
3. Подписчики видят «Иван печатает…» в шапке чата.
4. Параллельно каждые 30 секунд клиент шлёт `/app/heartbeat`,
   продлевая TTL ключа `presence:user:{id}` (60 секунд) — это
   формирует индикаторы «онлайн» в списке участников.

---

## 5. Структура базы данных

### 5.1. PostgreSQL — реляционная схема

PostgreSQL 16 хранит **строго структурированные данные с реляционными
связями**: пользователей, чаты, членство, сообщения и метаданные
вложений. Схема версионируется через **Flyway** (миграции V1–V5
в [`backend/src/main/resources/db/migration/`](backend/src/main/resources/db/migration/)).

#### ER-диаграмма (упрощённо)

```text
┌─────────┐  1     N  ┌──────────────┐  N     1  ┌────────┐
│  users  │──────────│ chats_members │──────────│ chats  │
└─────────┘           └──────────────┘           └────────┘
     │                                                │
     │ 1                                            1 │
     │ N                                            N │
     ▼                                                ▼
┌─────────┐                                     ┌──────────┐
│messages │──── 1..1 ──────►──── 0..1 ──────────│attachments│
└─────────┘   attachment_id                gridfs_id
                                                 (→Mongo)
```

#### Сущности

**`users`** — пользователи системы.

| Поле              | Тип                | Описание                              |
|-------------------|--------------------|---------------------------------------|
| `id`              | SERIAL PRIMARY KEY | Идентификатор                         |
| `idnp`            | VARCHAR(13) UNIQUE | Молдавский идентификационный номер    |
| `password_hash`   | VARCHAR(255)       | BCrypt-хеш пароля                     |
| `first_name`      | VARCHAR(100)       | Имя                                   |
| `last_name`       | VARCHAR(100)       | Фамилия                               |
| `email`           | VARCHAR(255)       | Электронная почта                     |
| `role`            | VARCHAR(20)        | Глобальная роль: STUDENT/TEACHER/ADMIN |
| `avatar_url`      | VARCHAR(500)       | Внешний URL (опционально)             |
| `avatar_file_id`  | VARCHAR(24)        | Ссылка на ObjectId документа в Mongo  |
| `created_at`      | TIMESTAMP          | Дата регистрации                      |
| `last_seen`       | TIMESTAMP          | Последний онлайн                      |
| `is_password_set` | BOOLEAN            | Флаг установки пароля                 |

**`chats`** — чаты (личные, групповые, каналы).
**`chats_members`** — связь many-to-many между пользователями и чатами,
с ролью в чате (`ADMIN`/`MEMBER`), флагами `is_pinned`/`is_muted`
и временем последнего прочтения `last_read_at`.
**`messages`** — сообщения с зашифрованным содержимым (поле `content`
хранит результат AES-GCM-шифрования, см. раздел 6).
**`attachments`** — метаданные вложений с обязательным полем
`gridfs_id`, указывающим на физический файл в MongoDB GridFS.

#### Полная DDL

См. файлы миграций:
- [`V1__init_schema.sql`](backend/src/main/resources/db/migration/V1__init_schema.sql) — базовая схема
- [`V2__seed_dev_data.sql`](backend/src/main/resources/db/migration/V2__seed_dev_data.sql) — демо-данные
- [`V3__presentation_auth_and_messages.sql`](backend/src/main/resources/db/migration/V3__presentation_auth_and_messages.sql) — пароли и тестовые сообщения
- [`V4__chat_member_last_read.sql`](backend/src/main/resources/db/migration/V4__chat_member_last_read.sql) — добавление `last_read_at`
- [`V5__attachments_and_avatars.sql`](backend/src/main/resources/db/migration/V5__attachments_and_avatars.sql) — переезд вложений на GridFS

### 5.2. MongoDB и GridFS — документное хранилище файлов

MongoDB 7 хранит **бинарные данные произвольного размера** через
встроенный механизм **GridFS** и сопутствующие метаданные.

GridFS автоматически разбивает файл на куски по 255 КБ
(стандартная chunk-size) и сохраняет их как отдельные документы
в коллекции `fs.chunks`, при этом метаданные файла (имя, размер,
MIME-тип, дата загрузки) кладутся в `fs.files`. Это снимает ограничение
на размер документа MongoDB (16 МБ).

#### Коллекции

| Коллекция        | Назначение                                                |
|------------------|-----------------------------------------------------------|
| `fs.files`       | Системные метаданные файла (генерируется GridFS)          |
| `fs.chunks`      | Бинарные блоки файла (генерируется GridFS)                |
| `file_metadata`  | Прикладные метаданные (наша коллекция, см. ниже)          |

#### Документ `file_metadata`

```json
{
  "_id": ObjectId("..."),
  "gridfsId": "65abc...",          // = _id документа в fs.files
  "originalName": "лекция.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 524288,
  "ownerId": 2,                     // FK на users.id (Postgres)
  "chatId": 5,                      // FK на chats.id (если ATTACHMENT) или null
  "purpose": "ATTACHMENT",          // ATTACHMENT | AVATAR_USER | AVATAR_CHAT
  "createdAt": ISODate("2026-04-29T17:23:00Z")
}
```

Индексы на полях `gridfsId`, `ownerId`, `chatId`, `purpose` обеспечивают
быстрый поиск по типичным запросам (все файлы пользователя, все вложения
конкретного чата).

### 5.3. Redis — in-memory кэш и состояние

Redis 7 используется для **эфемерных и часто изменяющихся данных**, где
ключевыми факторами являются скорость отклика (микросекунды) и
автоматическое истечение срока жизни записей (TTL).

#### Используемые структуры данных

| Ключ                                | Тип    | TTL    | Назначение                              |
|-------------------------------------|--------|--------|-----------------------------------------|
| `jwt:session:{jti}`                 | string | 24 ч   | Активные JWT-сессии (для отзыва)        |
| `presence:user:{userId}`            | string | 60 с   | Онлайн-статус, продлевается heartbeat'ом |
| `typing:chat:{chatId}`              | set    | 5 с    | Множество пользователей, печатающих в чате |
| `unread:user:{userId}:chat:{chatId}`| int    | 7 дней | Кэш счётчика непрочитанных сообщений    |

**Преимущества именно Redis:**

- TTL на уровне СУБД — не нужны cron-jobs для очистки.
- Атомарные операции `INCR`, `SADD`, `EXPIRE` — без блокировок.
- Pub/Sub-готовность для масштабирования на несколько backend-инстансов.
- Скорость в 10–100× выше, чем тот же запрос к Postgres.

#### Логика unread-кэша с fallback

Кэш-промах в `UnreadCacheService` приводит к пересчёту значения из
Postgres (запрос `countIncomingUnreadAfter` к `messages` с фильтром по
`last_read_at`). Свежепосчитанное значение записывается в Redis с TTL.
Это даёт **корректность данных при холодном старте** и **высокую
производительность** в установившемся режиме.

### 5.4. Связка СУБД между собой

Главная архитектурная особенность работы — это **точки связки** между
СУБД, обеспечивающие целостность данных в условиях polyglot persistence.

#### Связка Postgres ↔ MongoDB

Поле `attachments.gridfs_id` в Postgres равно полю `_id` документа в
коллекции `fs.files` MongoDB и полю `gridfsId` в `file_metadata`.

```
┌──────────────────── Postgres ────────────────────┐
│ messages                                          │
│   id=42, content=<encrypted>, attachment_id=7    │
│                          │                        │
│                          ▼                        │
│ attachments                                       │
│   id=7, file_name="лекция.pdf",                   │
│   gridfs_id="65abc..." ──────┐                    │
└──────────────────────────────┼────────────────────┘
                               │
                               ▼
┌──────────────────── MongoDB ─────────────────────┐
│ fs.files                                          │
│   _id=ObjectId("65abc..."),                       │
│   length=524288, filename="лекция.pdf"            │
│                                                   │
│ fs.chunks                                         │
│   files_id=ObjectId("65abc..."), n=0, data=BinData│
│   files_id=ObjectId("65abc..."), n=1, data=BinData│
│                                                   │
│ file_metadata                                     │
│   gridfsId="65abc...", ownerId=2, chatId=5,       │
│   purpose="ATTACHMENT"                            │
└───────────────────────────────────────────────────┘
```

Тот же приём используется для аватаров — `users.avatar_file_id` и
`chats.avatar_file_id` ссылаются на ObjectId GridFS-документов с
`purpose=AVATAR_USER`/`AVATAR_CHAT`.

#### Связка Postgres ↔ Redis

При вставке нового сообщения в `MessageService.sendMessage` сразу после
коммита Postgres-транзакции сервис обновляет счётчики в Redis для всех
участников чата, кроме отправителя:

```java
chatMemberRepository.findByChatId(chatId).forEach(member -> {
    Long memberId = member.getUser().getId();
    if (!memberId.equals(userId)) {
        unreadCache.increment(memberId, chatId);
    }
});
```

Аналогично, отметка сообщений как прочитанных
(`MessageService.markChatAsRead`) одновременно меняет
`chats_members.last_read_at` (Postgres) и сбрасывает
`unread:user:{u}:chat:{c}` в Redis.

---

## 6. Безопасность

### Хеширование паролей

Пароли никогда не сохраняются в открытом виде. Используется
**BCrypt** через `org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder`.
Каждый хеш содержит уникальную соль и cost-factor 10, что соответствует
рекомендациям OWASP на 2025 год.

### JWT-аутентификация с серверным отзывом

При входе генерируется токен HS256 с claim'ами:

- `sub` — идентификатор пользователя
- `jti` — UUID конкретной сессии
- `email` — email пользователя
- `iat`, `exp` — timestamps

Токен **подписан**, но без серверного состояния его нельзя инвалидировать
до истечения. Для решения этой проблемы применяется **Redis-blacklist
наоборот** (whitelist): при выходе соответствующий ключ
`jwt:session:{jti}` удаляется. `JwtAuthenticationFilter` помимо проверки
подписи также проверяет наличие сессии в Redis. Это даёт preimущества
JWT (stateless-проверка подписи) с возможностью мгновенного отзыва.

### Шифрование сообщений at-rest (AES-GCM)

Поле `messages.content` шифруется на стороне приложения перед записью
в БД алгоритмом **AES-GCM** (Galois/Counter Mode) с 256-битным ключом и
128-битным authentication tag. Префикс `enc:v1:` позволяет различать
зашифрованные и legacy-сообщения. Утилита: [`MessageCrypto.java`](backend/src/main/java/com/usm/messenger/security/MessageCrypto.java).

### TLS/HTTPS на всех каналах

- Frontend Nginx слушает HTTPS (порт 3000 → 443 в контейнере).
- Backend Spring Boot слушает HTTPS (порт 8443) с самоподписным
  PKCS12-keystore, генерируемым при сборке Docker-образа.
- WebSocket автоматически становится **WSS** (WebSocket Secure)
  поверх HTTPS-origin'а через SockJS/STOMP.

### Серверная и клиентская валидация

- На клиенте: HTML5-валидация типов и обязательности полей,
  блокировка кнопки submit при некорректных данных.
- На сервере: аннотации `@NotBlank`, `@Email`, `@Size`, `@Valid` на DTO;
  централизованная обработка `MethodArgumentNotValidException` через
  `GlobalExceptionHandler` с возвратом структурированных ошибок.

### Защита от типовых атак

- **SQL Injection** — использование параметризованных запросов через
  Spring Data JPA, никаких конкатенаций строк.
- **XSS** — React по умолчанию экранирует все динамические значения в
  JSX; пользовательский ввод никогда не вставляется как `dangerouslySetInnerHTML`.
- **CSRF** — CSRF-защита Spring Security отключена осознанно, так как
  приложение использует stateless-JWT в заголовке `Authorization`,
  а не cookie-based-сессии (такие токены недоступны через `<form>`-атаку).
- **Brute-force** — серверная валидация делает невозможным обход формы;
  для защиты от автоматизированного перебора предусмотрен задел под
  rate-limiting через Redis (счётчики попыток входа).

---

## 7. Примеры использования (фрагменты кода)

### Загрузка файла в MongoDB GridFS

[`FileService.java:51-101`](backend/src/main/java/com/usm/messenger/service/FileService.java)

```java
@Transactional
public AttachmentResponse uploadAttachment(MultipartFile file, Long userId, Long chatId)
        throws IOException {
    ensureMember(chatId, userId);
    FileMetadata meta = storeBinary(file, userId, chatId, PURPOSE_ATTACHMENT);

    User uploader = userRepo.findById(userId)
        .orElseThrow(() -> new AccessDeniedException("User not found"));

    Attachment a = Attachment.builder()
        .fileName(meta.getOriginalName())
        .fileType(meta.getMimeType())
        .fileSize(meta.getSizeBytes())
        .gridfsId(meta.getGridfsId())     // ← ключ связки с Mongo
        .uploadedBy(uploader)
        .createdAt(LocalDateTime.now())
        .build();
    a = attachmentRepo.save(a);

    return toResponse(a);
}

private FileMetadata storeBinary(MultipartFile file, Long ownerId, Long chatId, String purpose)
        throws IOException {
    try (InputStream in = file.getInputStream()) {
        ObjectId gridId = gridFs.store(in, file.getOriginalFilename(), file.getContentType());

        FileMetadata meta = FileMetadata.builder()
            .gridfsId(gridId.toHexString())
            .originalName(file.getOriginalFilename())
            .mimeType(file.getContentType())
            .sizeBytes(file.getSize())
            .ownerId(ownerId)
            .chatId(chatId)
            .purpose(purpose)
            .createdAt(Instant.now())
            .build();

        return metadataRepo.save(meta);
    }
}
```

### Работа с Redis (PresenceService)

[`PresenceService.java`](backend/src/main/java/com/usm/messenger/service/PresenceService.java)

```java
@Service
@RequiredArgsConstructor
public class PresenceService {

    public static final String STATUS_ONLINE = "ONLINE";
    private static final Duration TTL = Duration.ofSeconds(60);
    private static final String PREFIX = "presence:user:";

    private final StringRedisTemplate redis;

    public void markOnline(Long userId) {
        redis.opsForValue().set(key(userId), STATUS_ONLINE, TTL);
    }

    public void heartbeat(Long userId) {
        redis.expire(key(userId), TTL);
        if (Boolean.FALSE.equals(redis.hasKey(key(userId)))) {
            markOnline(userId);
        }
    }

    public Map<Long, String> getStatuses(List<Long> userIds) {
        // ... batch-запрос через MGET
    }

    private static String key(Long userId) { return PREFIX + userId; }
}
```

### JWT с серверным отзывом через Redis

[`JwtAuthenticationFilter.java`](backend/src/main/java/com/usm/messenger/security/JwtAuthenticationFilter.java)

```java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
        String token = header.substring(7).trim();
        try {
            Claims claims = tokenProvider.parse(token);     // проверка подписи
            String jti = claims.getId();
            if (sessions.isActive(jti)) {                    // проверка в Redis
                Long userId = Long.valueOf(claims.getSubject());
                AuthenticatedUser principal = new AuthenticatedUser(userId, ...);
                SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))));
            }
        } catch (JwtException ignored) { /* 401 на эндпоинте */ }
    }
    chain.doFilter(request, response);
}
```

### Шифрование сообщений (AES-GCM)

[`MessageCrypto.java`](backend/src/main/java/com/usm/messenger/security/MessageCrypto.java)

```java
public String encrypt(String plaintext) {
    byte[] iv = new byte[IV_LENGTH];
    random.nextBytes(iv);

    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
    byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

    byte[] payload = new byte[iv.length + cipherText.length];
    System.arraycopy(iv, 0, payload, 0, iv.length);
    System.arraycopy(cipherText, 0, payload, iv.length, cipherText.length);

    return "enc:v1:" + Base64.getEncoder().encodeToString(payload);
}
```

### Frontend: добавление Bearer-токена в каждый запрос

[`axios.ts`](frontend/src/api/axios.ts)

```typescript
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Frontend: WebSocket с Authorization-заголовком

[`ChatStompBridge.tsx`](frontend/src/components/chat/ChatStompBridge.tsx)

```typescript
const client = new Client({
  webSocketFactory: () => new SockJS(sockUrl) as unknown as WebSocket,
  connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  onConnect: () => {
    client.subscribe(`/topic/chats/${id}/messages`, onStompMessage);
    client.subscribe(`/topic/chats/${id}/typing`, onTypingFrame);
    client.subscribe('/topic/presence', onPresenceFrame);
  },
});
```

---

## 8. Инструкция по запуску

### Системные требования

- Docker Desktop 4.x или Docker Engine 24+ с Compose v2
- Свободные порты: 3000, 5432, 6379, 8443, 27017
- ~2 ГБ свободной оперативной памяти

### Запуск

```bash
git clone <url-репозитория>
cd usm-messenger
docker compose up --build
```

При первом запуске Docker соберёт два образа (backend и frontend),
скачает образы PostgreSQL/MongoDB/Redis и стартует все 5 контейнеров
с healthcheck'ами. Готовность приложения занимает ~30 секунд.

### Принятие самоподписных сертификатов

Так как приложение использует TLS с самоподписным сертификатом,
браузер при первом запуске требует ручного подтверждения:

1. Открыть `https://localhost:8443/api/health` → «Дополнительно» →
   «Перейти на localhost (небезопасно)».
2. Открыть `https://localhost:3000` → принять сертификат.

### Демо-учётные записи

После запуска применяются миграции Flyway, создающие 4 демо-пользователя
([`V2__seed_dev_data.sql`](backend/src/main/resources/db/migration/V2__seed_dev_data.sql)):

| Логин (email)            | Пароль     | Роль    |
|--------------------------|------------|---------|
| admin@usm.md             | Demo123!   | ADMIN   |
| ion.munteanu@usm.md      | Demo123!   | STUDENT |
| alexandra.popescu@usm.md | Demo123!   | STUDENT |
| dorin.lascari@usm.md     | Demo123!   | TEACHER |

### Точки доступа

| Сервис    | URL/команда                                         |
|-----------|-----------------------------------------------------|
| Frontend  | https://localhost:3000                              |
| Backend   | https://localhost:8443                              |
| Postgres  | `docker exec -it usm-postgres psql -U usm -d usm_messenger` |
| MongoDB   | `docker exec -it usm-mongo mongosh usm_messenger`   |
| Redis     | `docker exec -it usm-redis redis-cli`               |

---

## 9. Тестирование и проверка работы СУБД

### Просмотр данных

**PostgreSQL:**

```sql
docker exec -it usm-postgres psql -U usm -d usm_messenger
SELECT id, file_name, gridfs_id, file_size FROM attachments;
SELECT id, chat_id, sender_id, content FROM messages ORDER BY id DESC LIMIT 5;
-- Видно зашифрованные тела с префиксом enc:v1:
```

**MongoDB:**

```javascript
docker exec -it usm-mongo mongosh usm_messenger
show collections                                  // fs.chunks, fs.files, file_metadata
db.fs.files.find().pretty()                       // системные метаданные GridFS
db.file_metadata.find({ purpose: "ATTACHMENT" })  // прикладные метаданные
db.fs.chunks.countDocuments()                     // количество бинарных блоков
```

**Redis:**

```bash
docker exec -it usm-redis redis-cli
KEYS *                                            // все ключи
GET presence:user:1                               // онлайн-статус пользователя
TTL presence:user:1                               // оставшееся время жизни
SMEMBERS typing:chat:5                            // кто печатает в чате
GET unread:user:2:chat:1                          // счётчик непрочитанных
GET jwt:session:c4f8...                           // userId за активной сессией
MONITOR                                           // поток команд в реальном времени
```

### Проверка связки СУБД

После загрузки файла в чат:

```
1. В Postgres:  SELECT gridfs_id FROM attachments ORDER BY id DESC LIMIT 1;
   → "65abc1234567..."

2. В Mongo:     db.fs.files.findOne({_id: ObjectId("65abc1234567...")})
   → найдена запись с тем же _id, length и filename

3. В Redis:     GET unread:user:2:chat:1
   → счётчик увеличился у получателей сообщения
```

---

## 10. Ответы на контрольные вопросы

### 1. Что такое аутентификация и чем она отличается от авторизации?

**Аутентификация** — процесс установления личности пользователя, ответ
на вопрос «Кто ты?». В нашем приложении реализована через ввод логина
и пароля с последующей проверкой BCrypt-хеша.

**Авторизация** — проверка прав конкретной идентифицированной личности
на выполнение действия, ответ на вопрос «Что тебе разрешено?».
Например, удалить чат может только пользователь с ролью `ADMIN` в
этом чате (метод `ChatService.ensureAdmin`).

### 2. Почему пароли нужно хешировать, а не шифровать?

Шифрование обратимо — при компрометации ключа все пароли становятся
известны. Хеширование (BCrypt в нашем случае) **необратимо**: даже
имея доступ к БД, злоумышленник не может восстановить исходный
пароль, только проверить кандидат. BCrypt дополнительно использует
**соль** (защита от rainbow-таблиц) и **cost-factor** (замедление
brute-force на современном железе).

### 3. В чём преимущество JWT перед серверными сессиями?

JWT-токен **самодостаточен**: подпись проверяется без обращения к БД,
что делает аутентификацию stateless и горизонтально масштабируемой
(балансировщик может направить запрос на любой инстанс backend).
Недостаток — невозможность мгновенного отзыва. В нашем проекте этот
недостаток компенсирован хранением списка активных `jti` в Redis,
что объединяет преимущества обоих подходов.

### 4. Что такое polyglot persistence и зачем он нужен?

Polyglot persistence — это архитектурный подход, при котором
приложение использует **несколько типов СУБД** одновременно,
выбирая для каждого класса данных оптимальное хранилище. В нашем
случае: реляционная Postgres для целостности и связей, документная
MongoDB для бинарных файлов с гибкими метаданными, key-value Redis
для эфемерного состояния с TTL. Альтернатива — пытаться решить все
задачи одним типом СУБД — приводит либо к неэффективности (например,
хранение бинарей в Postgres), либо к усложнению (имитация TTL
самостоятельно).

### 5. Когда использовать NoSQL вместо реляционной БД?

Реляционная модель оптимальна для строго структурированных данных
со сложными связями и требованиями ACID. NoSQL целесообразен, когда:

- структура данных гетерогенна или часто меняется (документные БД);
- нужна высокая скорость чтения/записи простых ключей (key-value);
- объёмы данных не помещаются на одной машине и требуется sharding;
- характер запросов изначально не требует JOIN'ов.

В нашем проекте файлы и пользовательские metadata-документы хорошо
ложатся на MongoDB именно из-за гибкости схемы (поле `purpose`
может расширяться без миграций), а онлайн-статус с TTL — на Redis.

### 6. Что такое CSRF и как от него защищаться?

**CSRF** (Cross-Site Request Forgery) — атака, при которой
авторизованный пользователь невольно выполняет действие на стороннем
сайте через автоматическую отправку cookie-сессии. Защита: CSRF-токен
в каждой форме, проверка `SameSite`-атрибута cookie или переход на
header-based-аутентификацию (как у нас — JWT в `Authorization`,
которая недоступна форме другого origin'а).

### 7. Что такое XSS и как React защищает от него?

**XSS** (Cross-Site Scripting) — внедрение чужого JavaScript в
страницу через пользовательский ввод. React по умолчанию экранирует
все интерполяции в JSX (`{userInput}` превращается в безопасный
текстовый узел). Опасность возникает только при явном использовании
`dangerouslySetInnerHTML`, чего в проекте нет.

### 8. Что такое архитектура MVC и как она реализована в проекте?

**MVC** (Model–View–Controller) разделяет приложение на три слоя:

- **Model** — данные и бизнес-логика. У нас: Entity (JPA-сущности),
  Service (бизнес-операции), Repository (доступ к данным).
- **View** — представление. У нас: React-компоненты на frontend.
- **Controller** — маршрутизация и обработка запросов. У нас:
  Spring `@RestController`-классы.

DTO-слой между Controller и Service служит границей контракта API,
позволяя менять внутреннюю модель без поломки клиента.

### 9. Что такое REST?

**REST** (Representational State Transfer) — архитектурный стиль для
проектирования распределённых систем, основанный на принципах:

- ресурсы идентифицируются URL'ами (`/api/chats/5/messages`);
- HTTP-методы выражают намерение (`GET` — чтение, `POST` — создание,
  `PATCH` — частичное обновление, `DELETE` — удаление);
- stateless — сервер не хранит состояние клиента между запросами
  (каждый запрос содержит JWT в `Authorization`);
- единый формат данных (у нас — JSON).

### 10. Зачем нужна валидация на стороне сервера, если есть на клиенте?

Клиентская валидация — это **удобство для пользователя** (мгновенная
обратная связь), но клиент находится в недоверенной зоне: его можно
обойти через DevTools или прямой curl. Поэтому сервер **обязан
повторно проверить все данные**. Принцип: «никогда не доверяй клиенту».
В нашем проекте серверная валидация реализована через
`@Valid`-аннотации на DTO с автоматической обработкой нарушений.

---

## 11. Список использованных источников

1. **Spring Boot Reference Documentation**, версия 4.0.x — официальная
   документация фреймворка.
   <https://docs.spring.io/spring-boot/index.html>
2. **Spring Data MongoDB Reference Guide** —
   <https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/>
3. **Spring Data Redis Reference Guide** —
   <https://docs.spring.io/spring-data/redis/docs/current/reference/html/>
4. **MongoDB Manual: GridFS** — официальное описание механизма
   хранения больших файлов.
   <https://www.mongodb.com/docs/manual/core/gridfs/>
5. **Redis Documentation** — <https://redis.io/docs/>
6. **JJWT (Java JWT)** — библиотека генерации и валидации JWT.
   <https://github.com/jwtk/jjwt>
7. **OWASP Cheat Sheet Series**, в частности «Password Storage Cheat
   Sheet» (рекомендации по BCrypt) и «JSON Web Token Cheat Sheet».
   <https://cheatsheetseries.owasp.org/>
8. **NIST SP 800-38D**, спецификация AES-GCM.
   <https://csrc.nist.gov/publications/detail/sp/800-38d/final>
9. **RFC 7519** — JSON Web Token (JWT).
   <https://www.rfc-editor.org/rfc/rfc7519>
10. **React Documentation** — <https://react.dev/>
11. **TanStack Query Documentation** — <https://tanstack.com/query/latest>
12. **STOMP Protocol Specification 1.2** —
    <https://stomp.github.io/stomp-specification-1.2.html>
13. **Sadalage P. J., Fowler M.** «NoSQL Distilled: A Brief Guide to
    the Emerging World of Polyglot Persistence», 2012 — концепция
    polyglot persistence.
14. **Flyway Documentation** — версионирование миграций PostgreSQL.
    <https://documentation.red-gate.com/fd/>

---

## 12. Структура репозитория

```
usm-messenger/
├── backend/                              # Spring Boot backend
│   ├── src/main/java/com/usm/messenger/
│   │   ├── config/                       # Spring-конфиги (Security, WebSocket, Mongo, CORS)
│   │   ├── controller/                   # REST и WebSocket контроллеры
│   │   ├── dto/                          # Request/Response DTO
│   │   ├── entity/                       # JPA + MongoDB сущности
│   │   ├── exception/                    # Кастомные исключения и хэндлер
│   │   ├── listener/                     # WebSocket event-listeners (presence)
│   │   ├── repository/                   # JPA и MongoRepository интерфейсы
│   │   ├── security/                     # JWT, MessageCrypto, RedisSessionService
│   │   └── service/                      # Бизнес-логика (Chat, Message, File, Presence, ...)
│   ├── src/main/resources/
│   │   ├── application.yml               # Конфигурация Spring
│   │   ├── db/migration/                 # Flyway-миграции V1–V5
│   │   └── keystore.p12                  # TLS keystore (генерируется при сборке)
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                             # React frontend
│   ├── src/
│   │   ├── api/                          # axios-обёртки REST-эндпоинтов
│   │   ├── components/                   # React-компоненты (Avatar, Chat*, EmptyStates, ...)
│   │   ├── hooks/                        # React-хуки (useAuth, useChats, useMessages)
│   │   ├── pages/                        # Страницы приложения
│   │   ├── store/                        # Zustand-сторы (auth, presence)
│   │   └── types/                        # TypeScript-типы
│   ├── nginx.conf                        # TLS-конфиг nginx
│   └── Dockerfile
├── docker-compose.yml                    # 5 сервисов: postgres, mongodb, redis, backend, frontend
└── README.md                             # Этот файл
```
