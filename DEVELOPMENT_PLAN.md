# USMchat - План разработки мессенджера

## 📋 Обзор проекта

**Название**: USMchat  
**Цель**: Мессенджер для Молдавского государственного университета, позволяющий преподавателям и студентам общаться в организованных групповых чатах.  
**Команда**: Илья, Мария  
**Тип**: Курсовая работа

---

## 🎯 Целевая аудитория

### Студенты (Ana, 20 лет)
- **Цели**: Не пропускать сообщения по учёбе, быстро находить задания и файлы
- **Боли**: Чаты разбросаны по разным мессенджерам, теряются файлы, много шума от уведомлений
- **Потребности**: Папки для чатов, поиск по сообщениям, синхронизация между устройствами

### Преподаватели (Victor, 32 года)
- **Цели**: Связь с группами студентов, быстрая раздача материалов
- **Боли**: Студенты пишут в разных сервисах, трудно найти прошлые файлы
- **Потребности**: Структура чатов по группам, отключение уведомлений

---

## 🔐 Архитектура аутентификации

### ⚠️ Критически важно: НЕ использовать только IDNP

**Почему IDNP недостаточно:**
- IDNP — публичная информация (одногруппники знают друг друга)
- Нет защиты от несанкционированного доступа
- Нарушение базовых принципов безопасности

### Рекомендуемый подход (MVP)

```
┌─────────────────────────────────────────────────────────┐
│                    Первый вход                          │
├─────────────────────────────────────────────────────────┤
│  1. Студент вводит IDNP                                 │
│  2. Система проверяет IDNP в базе (предзагружен админом)│
│  3. Если первый вход → установка пароля                 │
│  4. Если повторный → ввод пароля                        │
│  5. Выдача JWT токена                                   │
└─────────────────────────────────────────────────────────┘
```

### Структура аутентификации

| Этап | Действие | Безопасность |
|------|----------|--------------|
| Регистрация | Админ загружает список студентов с IDNP | Только админ |
| Первый вход | IDNP + установка пароля | Минимум 8 символов |
| Последующие входы | IDNP + пароль | JWT токен (24ч) |
| Восстановление | Через админа или email университета | Сброс пароля |

---

## 🏗️ Архитектура системы

### Общая схема

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│  React Frontend  │────▶│  Spring Boot API │────▶│   PostgreSQL     │
│  (TypeScript)    │     │  (REST + WS)     │     │   Database       │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌──────────────────┐     ┌──────────────────┐
│   WebSocket      │     │   File Storage   │
│   (STOMP)        │     │   (Local/S3)     │
└──────────────────┘     └──────────────────┘
```

### Технологический стек

#### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.x | UI библиотека |
| TypeScript | 5.x | Типизация |
| Vite | 5.x | Сборщик |
| React Router | 6.x | Роутинг |
| Zustand | 4.x | State management |
| TanStack Query | 5.x | Серверное состояние |
| Tailwind CSS | 3.x | Стилизация |
| Socket.io-client | 4.x | WebSocket клиент |
| Axios | 1.x | HTTP клиент |

#### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Java | 21 LTS | Язык |
| Spring Boot | 3.2.x | Фреймворк |
| Spring Security | 6.x | Безопасность |
| Spring WebSocket | - | Real-time |
| Spring Data JPA | - | ORM |
| PostgreSQL | 16.x | База данных |
| Lombok | - | Boilerplate reduction |
| MapStruct | - | DTO mapping |
| JWT (jjwt) | 0.12.x | Токены |

#### DevOps / Инфраструктура
| Технология | Назначение |
|------------|------------|
| Docker | Контейнеризация |
| Docker Compose | Локальная оркестрация |
| GitHub Actions | CI/CD |
| Railway / Render | Бесплатный хостинг |

---

## 🗄️ Схема базы данных

### ER-диаграмма

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │   chat_members  │       │     chats       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │    ┌──│ id (PK)         │
│ idnp (UNIQUE)   │  │    │ user_id (FK)    │────┤  │ name            │
│ password_hash   │  └───▶│ chat_id (FK)    │────┘  │ type            │
│ first_name      │       │ role            │       │ created_at      │
│ last_name       │       │ joined_at       │       │ created_by (FK) │
│ email           │       │ is_pinned       │       │ avatar_url      │
│ role            │       └─────────────────┘       └─────────────────┘
│ avatar_url      │                                         │
│ created_at      │       ┌─────────────────┐               │
│ last_seen       │       │    messages     │               │
└─────────────────┘       ├─────────────────┤               │
         │                │ id (PK)         │               │
         │                │ chat_id (FK)    │───────────────┘
         └───────────────▶│ sender_id (FK)  │
                          │ content         │
                          │ type            │
                          │ created_at      │
                          │ updated_at      │
                          │ is_read         │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   attachments   │       │     folders     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ message_id (FK) │       │ user_id (FK)    │
│ file_name       │       │ name            │
│ file_url        │       │ color           │
│ file_type       │       └─────────────────┘
│ file_size       │
└─────────────────┘       ┌─────────────────┐
                          │  chat_folders   │
                          ├─────────────────┤
                          │ folder_id (FK)  │
                          │ chat_id (FK)    │
                          └─────────────────┘
```

### SQL миграции

```sql
-- V1__init_schema.sql

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    idnp VARCHAR(13) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    is_password_set BOOLEAN DEFAULT FALSE
);

-- Чаты
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- GROUP, DIRECT, CHANNEL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    avatar_url VARCHAR(500),
    description TEXT
);

-- Участники чатов
CREATE TABLE IF NOT EXISTS chat_members (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER', -- ADMIN, MEMBER
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, chat_id)
);

-- Сообщения
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    content TEXT,
    type VARCHAR(20) DEFAULT 'TEXT', -- TEXT, FILE, IMAGE, SYSTEM
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    reply_to_id BIGINT REFERENCES messages(id)
);

-- Статус прочтения
CREATE TABLE IF NOT EXISTS message_read_status (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Вложения
CREATE TABLE IF NOT EXISTS attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT
);

-- Папки пользователя
CREATE TABLE IF NOT EXISTS folders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#24513C'
);

-- Связь чатов и папок
CREATE TABLE IF NOT EXISTS chat_folders (
    folder_id BIGINT REFERENCES folders(id) ON DELETE CASCADE,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    PRIMARY KEY (folder_id, chat_id)
);

-- Индексы
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_users_idnp ON users(idnp);
```

---

## 📁 Структура проекта

### Frontend (React + TypeScript)

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # API клиент
│   │   ├── axios.ts            # Конфигурация axios
│   │   ├── auth.api.ts         # Аутентификация
│   │   ├── chats.api.ts        # Чаты
│   │   ├── messages.api.ts     # Сообщения
│   │   └── users.api.ts        # Пользователи
│   │
│   ├── components/             # Переиспользуемые компоненты
│   │   ├── ui/                 # Базовые UI компоненты
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Badge.tsx
│   │   ├── chat/               # Компоненты чата
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatItem.tsx
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── PinnedChats.tsx
│   │   └── layout/             # Layout компоненты
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── MainLayout.tsx
│   │
│   ├── pages/                  # Страницы
│   │   ├── LoginPage.tsx
│   │   ├── SetPasswordPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ContactsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── hooks/                  # Кастомные хуки
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useChats.ts
│   │   └── useMessages.ts
│   │
│   ├── store/                  # Zustand stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/                  # TypeScript типы
│   │   ├── user.types.ts
│   │   ├── chat.types.ts
│   │   └── message.types.ts
│   │
│   ├── utils/                  # Утилиты
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── styles/                 # Глобальные стили
│   │   └── globals.css
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env.example
├── .eslintrc.cjs
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### Backend (Spring Boot)

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/usm/messenger/
│   │   │   ├── UsmMessengerApplication.java
│   │   │   │
│   │   │   ├── config/                  # Конфигурация
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── WebSocketConfig.java
│   │   │   │   ├── CorsConfig.java
│   │   │   │   └── JwtConfig.java
│   │   │   │
│   │   │   ├── controller/              # REST контроллеры
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── ChatController.java
│   │   │   │   ├── MessageController.java
│   │   │   │   ├── UserController.java
│   │   │   │   └── FileController.java
│   │   │   │
│   │   │   ├── websocket/               # WebSocket
│   │   │   │   ├── ChatWebSocketHandler.java
│   │   │   │   └── WebSocketEventListener.java
│   │   │   │
│   │   │   ├── service/                 # Бизнес-логика
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── ChatService.java
│   │   │   │   ├── MessageService.java
│   │   │   │   ├── UserService.java
│   │   │   │   └── FileService.java
│   │   │   │
│   │   │   ├── repository/              # JPA репозитории
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ChatRepository.java
│   │   │   │   ├── MessageRepository.java
│   │   │   │   └── ChatMemberRepository.java
│   │   │   │
│   │   │   ├── entity/                  # JPA сущности
│   │   │   │   ├── User.java
│   │   │   │   ├── Chat.java
│   │   │   │   ├── Message.java
│   │   │   │   ├── ChatMember.java
│   │   │   │   └── Attachment.java
│   │   │   │
│   │   │   ├── dto/                     # DTO объекты
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── SetPasswordRequest.java
│   │   │   │   │   └── SendMessageRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── AuthResponse.java
│   │   │   │       ├── ChatResponse.java
│   │   │   │       └── MessageResponse.java
│   │   │   │
│   │   │   ├── security/                # Безопасность
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── UserDetailsServiceImpl.java
│   │   │   │
│   │   │   ├── exception/               # Исключения
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── UserNotFoundException.java
│   │   │   │   └── ChatNotFoundException.java
│   │   │   │
│   │   │   └── mapper/                  # MapStruct mappers
│   │   │       ├── UserMapper.java
│   │   │       ├── ChatMapper.java
│   │   │       └── MessageMapper.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/            # Flyway миграции
│   │           └── V1__init_schema.sql
│   │
│   └── test/
│       └── java/com/usm/messenger/
│           ├── controller/
│           ├── service/
│           └── repository/
│
├── .env.example
├── Dockerfile
├── pom.xml
└── mvnw
```

---

## 🎨 UI/UX Спецификация (из Figma)

### Цветовая палитра

| Название | HEX | Использование |
|----------|-----|---------------|
| Primary Green | `#24513C` | Основной зелёный, акценты, сообщения пользователя |
| Light Green | `#E3F2EC` | Фон активных элементов, список чатов |
| Background Light | `#F5F5F5` | Общий фон приложения |
| Bubble Light | `#FFFFFF` | Фон входящих сообщений |
| Accent Red | `#D7383B` | Индикатор непрочитанных, ошибки |
| Text Main | `#232323` | Основной текст |
| Text Muted | `#8F9A8C` | Вторичный текст, подписи |

### Типографика

| Стиль | Размер | Вес | Использование |
|-------|--------|-----|---------------|
| H1 | 24px | SemiBold | Заголовки страниц |
| H2 | 18px | Medium | Заголовки секций |
| Body | 14-16px | Regular | Основной текст, сообщения |
| Caption | 10px | Regular | Подписи, время сообщений |

### Tailwind конфигурация

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#24513C',
          light: '#E3F2EC',
        },
        background: '#F5F5F5',
        bubble: '#FFFFFF',
        accent: {
          red: '#D7383B',
        },
        text: {
          main: '#232323',
          muted: '#8F9A8C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

---

## 🔌 API Endpoints

### Аутентификация

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/login` | Вход (IDNP + пароль) |
| POST | `/api/auth/set-password` | Установка пароля (первый вход) |
| POST | `/api/auth/refresh` | Обновление токена |
| POST | `/api/auth/logout` | Выход |

### Пользователи

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/users/me` | Текущий пользователь |
| PATCH | `/api/users/me` | Обновление профиля |
| GET | `/api/users/search?q=` | Поиск пользователей |
| GET | `/api/users/{id}` | Профиль пользователя |

### Чаты

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/chats` | Список чатов пользователя |
| GET | `/api/chats/{id}` | Информация о чате |
| POST | `/api/chats` | Создание чата (админ) |
| PATCH | `/api/chats/{id}/pin` | Закрепить/открепить чат |
| PATCH | `/api/chats/{id}/mute` | Заглушить уведомления |
| GET | `/api/chats/{id}/members` | Участники чата |

### Сообщения

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/chats/{chatId}/messages` | Сообщения чата (пагинация) |
| POST | `/api/chats/{chatId}/messages` | Отправка сообщения |
| DELETE | `/api/messages/{id}` | Удаление сообщения |
| GET | `/api/chats/{chatId}/messages/search?q=` | Поиск по сообщениям |

### Файлы

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/files/upload` | Загрузка файла |
| GET | `/api/files/{id}` | Скачивание файла |

### WebSocket

```
STOMP endpoint: /ws

Подписки:
- /user/queue/messages     - Личные сообщения
- /topic/chat/{chatId}     - Сообщения чата
- /user/queue/notifications - Уведомления

Отправка:
- /app/chat.send           - Отправка сообщения
- /app/chat.typing         - Индикатор печати
```

---

## 📅 Этапы разработки

### Фаза 1: Инициализация (1-2 дня)

#### Backend
- [ ] Создание Spring Boot проекта через Spring Initializr
- [ ] Настройка структуры пакетов
- [ ] Подключение PostgreSQL
- [ ] Настройка Flyway миграций
- [ ] Базовая конфигурация безопасности

#### Frontend
- [ ] Создание Vite + React + TypeScript проекта
- [ ] Настройка Tailwind CSS
- [ ] Настройка ESLint + Prettier
- [ ] Базовая структура папок
- [ ] Настройка роутинга

#### DevOps
- [ ] Создание docker-compose.yml для локальной разработки
- [ ] Настройка .env файлов

### Фаза 2: Аутентификация (3-4 дня)

#### Backend
- [ ] Сущность User + репозиторий
- [ ] JWT токены (генерация, валидация)
- [ ] AuthController (login, set-password)
- [ ] Spring Security фильтры
- [ ] Endpoint /users/me

#### Frontend
- [ ] Страница входа (LoginPage)
- [ ] Страница установки пароля (SetPasswordPage)
- [ ] AuthStore (Zustand)
- [ ] Защищённые роуты
- [ ] Хранение токена

### Фаза 3: Чаты - базовый функционал (4-5 дней)

#### Backend
- [ ] Сущности Chat, ChatMember
- [ ] ChatService + ChatRepository
- [ ] CRUD операции для чатов
- [ ] Получение списка чатов пользователя

#### Frontend
- [ ] MainLayout (Sidebar + Chat area)
- [ ] ChatList компонент
- [ ] ChatItem компонент
- [ ] Базовая страница чата

### Фаза 4: Сообщения (5-6 дней)

#### Backend
- [ ] Сущность Message + репозиторий
- [ ] MessageService
- [ ] REST endpoints для сообщений
- [ ] Пагинация сообщений
- [ ] WebSocket конфигурация
- [ ] STOMP handlers

#### Frontend
- [ ] MessageList компонент
- [ ] MessageItem компонент
- [ ] MessageInput компонент
- [ ] WebSocket подключение
- [ ] Real-time обновления
- [ ] Скролл к последнему сообщению

### Фаза 5: Дополнительные функции (3-4 дня)

#### Backend
- [ ] Загрузка файлов
- [ ] Статус прочтения
- [ ] Поиск по сообщениям
- [ ] Закрепление чатов

#### Frontend
- [ ] Индикатор "печатает..."
- [ ] Загрузка файлов
- [ ] Превью изображений
- [ ] Закреплённые чаты
- [ ] Поиск

### Фаза 6: Админ-панель (2-3 дня)

- [ ] Страница управления пользователями
- [ ] Импорт пользователей (CSV с IDNP)
- [ ] Создание чатов
- [ ] Добавление пользователей в чаты

### Фаза 7: Полировка (2-3 дня)

- [ ] Обработка ошибок
- [ ] Loading states
- [ ] Пустые состояния
- [ ] Адаптивность (mobile)
- [ ] Оптимизация производительности

### Фаза 8: Деплой (1-2 дня)

- [ ] Dockerfile для backend
- [ ] Build frontend
- [ ] Настройка Railway/Render
- [ ] CI/CD через GitHub Actions
- [ ] Тестирование на проде

---

## 🚀 Команды для быстрого старта

### Backend

```powershell
# Создание проекта через Spring Initializr (или скачать с start.spring.io)
# Dependencies: Spring Web, Spring Security, Spring Data JPA, 
#              PostgreSQL Driver, Lombok, Validation, WebSocket

# Запуск PostgreSQL через Docker
docker run -d --name usm-postgres `
  -e POSTGRES_DB=usm_messenger `
  -e POSTGRES_USER=usm `
  -e POSTGRES_PASSWORD=usm123 `
  -p 5432:5432 `
  postgres:16-alpine

# Запуск приложения
cd backend
./mvnw spring-boot:run
```

### Frontend

```powershell
# Создание проекта
npm create vite@latest frontend -- --template react-ts
cd frontend

# Установка зависимостей
npm install
npm install -D tailwindcss postcss autoprefixer
npm install zustand @tanstack/react-query axios react-router-dom
npm install socket.io-client
npm install clsx tailwind-merge lucide-react

# Инициализация Tailwind
npx tailwindcss init -p

# Запуск
npm run dev
```

### Docker Compose (полный стек)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: usm_messenger
      POSTGRES_USER: usm
      POSTGRES_PASSWORD: usm123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/usm_messenger
      SPRING_DATASOURCE_USERNAME: usm
      SPRING_DATASOURCE_PASSWORD: usm123
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 🌐 Деплой на бесплатный хостинг

### Вариант 1: Railway (рекомендуется)

**Преимущества**: 
- Бесплатный tier ($5 кредитов/месяц)
- PostgreSQL из коробки
- Автодеплой из GitHub

**Шаги**:
1. Создать аккаунт на railway.app
2. Подключить GitHub репозиторий
3. Добавить PostgreSQL service
4. Настроить environment variables
5. Deploy!

### Вариант 2: Render

**Backend**: Web Service (free tier)  
**Frontend**: Static Site (free)  
**Database**: PostgreSQL (free tier, 90 дней)

### Вариант 3: Vercel + Railway

- Frontend на Vercel (бесконечный free tier)
- Backend + DB на Railway

---

## 📝 Чеклист перед релизом

- [ ] Все API endpoints протестированы
- [ ] WebSocket работает стабильно
- [ ] Авторизация работает корректно
- [ ] Нет console.log в продакшене
- [ ] Environment variables настроены
- [ ] CORS настроен правильно
- [ ] SSL сертификаты (HTTPS)
- [ ] Error boundaries на фронте
- [ ] Логирование на бэке
- [ ] README обновлён

---

## 💡 Возможные улучшения (v2.0)

- [ ] Push уведомления
- [ ] Тёмная тема
- [ ] Ответ на сообщение (reply)
- [ ] Редактирование сообщений
- [ ] Реакции на сообщения
- [ ] Голосовые сообщения
- [ ] Видео/аудио звонки (WebRTC)
- [ ] Интеграция с расписанием университета
- [ ] Мобильное приложение (React Native)
- [ ] Боты для автоматизации

---

## ⚠️ Известные ограничения

1. **Бесплатные хостинги** имеют ограничения по ресурсам и времени работы
2. **WebSocket** на бесплатных планах может быть нестабильным
3. **Файловое хранилище** — нужно внешнее решение (Cloudinary, S3) для продакшена
4. **Масштабирование** — текущая архитектура рассчитана на небольшую нагрузку

---

*Документ создан: Февраль 2026*  
*Последнее обновление: —*
