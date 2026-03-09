# Фаза 3: Чаты — базовый функционал

**Продолжительность**: 4–5 дней  
**Команда**: Илья (опытный), Мария (junior)  
**Принцип разделения**: по фичам (каждый делает и backend, и frontend)

> Фаза 2 (аутентификация) пропущена. Вместо полноценного JWT используется
> упрощённая mock-авторизация — см. раздел «Как работает mock-авторизация».

---

## Содержание

1. [Как работает mock-авторизация в этой фазе](#как-работает-mock-авторизация-в-этой-фазе)
2. [Задачи Ильи](#задачи-ильи)
   - [0. Подготовка: багфиксы и инфраструктура](#0-подготовка-багфиксы-и-инфраструктура)
   - [Фича A: Ядро чатов + Список чатов](#фича-a-ядро-чатов--список-чатов)
3. [Задачи Марии](#задачи-марии)
   - [Фича B: UI-компоненты, Layout и экран чата](#фича-b-ui-компоненты-layout-и-экран-чата)
4. [Интеграция и тестирование](#интеграция-и-тестирование)
5. [Зависимости между задачами](#зависимости-между-задачами)
6. [Рекомендуемый порядок по дням](#рекомендуемый-порядок-по-дням)
7. [Критерии готовности фазы](#критерии-готовности-фазы)

---

## Как работает mock-авторизация в этой фазе

Настоящая аутентификация (JWT-токены, пароли, Spring Security фильтры) — это
Фаза 2, которую мы пока пропускаем. Но приложению нужно понимать, **кто
сейчас пользователь**, чтобы показывать его чаты, имя и т.д.

### Принцип: максимально просто, минимум кода

Вместо полноценного входа делаем **страницу выбора пользователя** — это
выпадающий список (dropdown) с тестовыми пользователями из БД. Выбрал
пользователя → сохранил в localStorage → пользуешься приложением.

### Что нужно реализовать

**Backend (делает Илья):**

Один GET-эндпоинт, который возвращает список всех пользователей:

```
GET /api/users → [{ id: 1, firstName: "Admin", ... }, ...]
```

Этот эндпоинт уже нужен для других задач (поиск пользователей), поэтому
дополнительного кода для mock-авторизации на backend **почти нет**.

**Frontend (делает Илья в рамках подготовки):**

1. Страница `/login` — показывает dropdown со списком пользователей из БД.
   Пользователь выбирает себя → нажимает «Войти» → редирект на `/chat`.
2. Zustand-стор `authStore` — хранит выбранного пользователя в state и
   localStorage (чтобы при перезагрузке не выбирать заново).
3. Все API-запросы передают `userId` как query-параметр:
   `GET /api/chats?userId=2` — это временная замена JWT.

### Что НЕ нужно реализовывать

- Никаких JWT-токенов, refresh-токенов
- Никаких паролей и хэширования
- Никаких POST /auth/login, /auth/logout
- Никаких interceptor'ов для подстановки токена в заголовки
- Никаких Spring Security фильтров (уже стоит `permitAll()` — не трогаем)

### Когда уберём mock

В Фазе 2, когда реализуем настоящую аутентификацию:
- Заменим dropdown на форму логина (IDNP + пароль)
- Уберём `?userId=` из всех API — вместо этого userId будет извлекаться из
  JWT-токена на бэкенде
- `authStore` будет хранить токен вместо объекта пользователя

### Объём кода mock-авторизации

| Что | Где | Строк кода |
|-----|-----|-----------|
| GET /api/users | UserController.java | ~5 |
| Страница выбора | MockLoginPage.tsx | ~40 |
| authStore | authStore.ts | ~25 |
| **Итого** | | **~70 строк** |

Это минимально необходимый объём, который потом легко заменить.

---

## Задачи Ильи

### 0. Подготовка: багфиксы и инфраструктура

Прежде чем начинать фичи, нужно починить то, что сломано после Phase 1,
и подготовить инфраструктуру для работы Марии.

---

#### 0.1 Исправление миграции БД

**Файл**: `backend/src/main/resources/db/migration/V1_init_schema.sql`

**Проблемы и исправления:**

1. **Переименовать файл**: `V1_init_schema.sql` → `V1__init_schema.sql` (два подчёркивания — требование Flyway)
2. **Двойные кавычки → одинарные** для строковых значений по умолчанию:
   - `DEFAULT "STUDENT"` → `DEFAULT 'STUDENT'`
   - `DEFAULT "MEMBER"` → `DEFAULT 'MEMBER'`
   - `DEFAULT "TEXT"` → `DEFAULT 'TEXT'`
   - `DEFAULT "#24513C"` → `DEFAULT '#24513C'`
3. **Пустой DEFAULT**: `joined_at TIMESTAMP DEFAULT,` → `joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,`
4. **Дублирование CREATE**: `CREATE CREATE TABLE` → `CREATE TABLE`
5. **Опечатки**: `ON DELTE CASCADE` → `ON DELETE CASCADE`, `ON mwssages` → `ON messages`
6. **IDNP seed**: `'20011234567890'` (14 символов) → `'2001123456789'` (13 символов, под `VARCHAR(13)`)

**Ход выполнения:**

```
1. Открыть файл миграции
2. Исправить все ошибки по списку выше
3. Переименовать файл (V1 → V1__)
4. Запустить docker-compose up postgres
5. Запустить backend и убедиться, что Flyway применяет миграцию без ошибок
6. Проверить в pgAdmin/psql, что все таблицы созданы
7. Commit: "fix: flyway migration syntax errors and filename"
```

---

#### 0.2 Исправление CORS-конфигурации

**Файл**: `backend/src/main/java/com/usm/messenger/config/CorsConfig.java`

**Проблема**: опечатка `"http://localhost^5173"` — каретка `^` вместо двоеточия `:`.

**Исправление:**

```java
// Было:
"http://localhost^5173"

// Стало:
"http://localhost:5173"
```

**Ход выполнения:**

```
1. Открыть CorsConfig.java
2. Найти строку с ^5173, заменить ^ на :
3. Убедиться, что все нужные origins перечислены: localhost:5173, localhost:3000
4. Перезапустить backend
5. Проверить из браузера: открыть фронтенд (localhost:5173), в DevTools →
   Network убедиться, что запросы к API проходят без CORS-ошибок
6. Commit: "fix: cors config typo in vite dev server origin"
```

---

#### 0.3 Исправление фронтенда (App.tsx + index.html)

**Файлы**: `frontend/src/App.tsx`, `frontend/App.tsx`, `frontend/index.html`

**Проблемы:**
- `src/App.tsx` — стандартный шаблон Vite (счётчик кликов), не используется роутинг
- `frontend/App.tsx` (вне src/) — кастомный App с React Router, но он не подключён
- `index.html` — заголовок "frontend", шрифт Inter не подключён

**Ход выполнения:**

```
1. Удалить frontend/App.tsx (тот что вне src/)
2. Переписать frontend/src/App.tsx — добавить React Router:
   - Импорт BrowserRouter, Routes, Route из react-router-dom
   - Маршруты: "/" → редирект на /login, "/login" → MockLoginPage,
     "/chat" → MainLayout с вложенными маршрутами
   - Обернуть в QueryClientProvider из @tanstack/react-query
3. Обновить index.html:
   - Заголовок: "frontend" → "USMchat"
   - Добавить Google Fonts link для Inter:
     <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
4. Удалить src/assets/react.svg и public/vite.svg (не нужны)
5. Удалить дублирующий ESLint конфиг: src/types/.eslintrc.cjs
6. Запустить npm run dev, убедиться что приложение запускается без ошибок
7. Commit: "fix: replace vite template with router setup, fix index.html"
```

---

#### 0.4 Seed-данные для разработки

**Файл**: `backend/src/main/resources/db/migration/V2__seed_dev_data.sql` (новый)

Тестовые данные, чтобы было с чем работать на фронтенде.

```sql
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
  ('Anunțuri Facultate', 'CHANNEL', 1, 'Объявления факультета')
ON CONFLICT DO NOTHING;

INSERT INTO chat_members (user_id, chat_id, role)
VALUES
  (1, 1, 'ADMIN'), (2, 1, 'MEMBER'), (3, 1, 'MEMBER'), (4, 1, 'ADMIN'),
  (1, 2, 'ADMIN'), (2, 2, 'MEMBER'), (3, 2, 'MEMBER'),
  (2, 3, 'MEMBER'), (3, 3, 'MEMBER'), (4, 3, 'ADMIN'),
  (1, 4, 'ADMIN'), (2, 4, 'MEMBER'), (3, 4, 'MEMBER'), (4, 4, 'MEMBER')
ON CONFLICT (user_id, chat_id) DO NOTHING;
```

**Ход выполнения:**

```
1. Создать файл V2__seed_dev_data.sql в db/migration/
2. Перезапустить backend — Flyway применит миграцию
3. Проверить в БД: SELECT * FROM users; SELECT * FROM chats;
4. Commit: "feat: add seed data for development"
```

---

#### 0.5 Mock-авторизация (frontend + backend)

Реализация mock-авторизации, как описано в разделе выше.

**Backend:**

Добавить в `UserController` (который будет создан в A.5) метод:
```java
@GetMapping
public List<UserResponse> getAllUsers() {
    return userService.getAllUsers();
}
```

**Frontend:**

1. `src/store/authStore.ts` — Zustand-стор:

```typescript
interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}
```

Хранит выбранного пользователя. Использует `persist` middleware из Zustand,
чтобы при обновлении страницы данные сохранялись в localStorage.

2. `src/pages/MockLoginPage.tsx`:
   - При загрузке — `GET /api/users` → получить список пользователей
   - Показать dropdown с именами
   - Кнопка «Войти» → сохранить в authStore → navigate('/chat')

**Ход выполнения:**

```
1. Создать authStore.ts
2. Создать MockLoginPage.tsx
3. Подключить маршрут /login → MockLoginPage в App.tsx
4. Проверить: выбрать пользователя → попасть на /chat → обновить страницу →
   пользователь сохранён
5. Commit: "feat: add mock login with user picker"
```

---

### Фича A: Ядро чатов + Список чатов

**Суть**: полный backend для чатов + фронтенд-компоненты списка чатов.

**Результат**: пользователь видит свои чаты в боковой панели, может кликнуть на чат.

---

#### A.1 JPA-сущности (Backend)

**Файлы:**
- `backend/src/main/java/com/usm/messenger/entity/User.java`
- `backend/src/main/java/com/usm/messenger/entity/Chat.java`
- `backend/src/main/java/com/usm/messenger/entity/ChatMember.java`
- `backend/src/main/java/com/usm/messenger/entity/enums/UserRole.java`
- `backend/src/main/java/com/usm/messenger/entity/enums/ChatType.java`
- `backend/src/main/java/com/usm/messenger/entity/enums/ChatMemberRole.java`

**Ход выполнения:**

```
1. Создать User.java:
   - @Entity, @Table(name = "users")
   - Поля: id (Long, @Id, @GeneratedValue), idnp, passwordHash, firstName,
     lastName, email, role (enum: ADMIN, TEACHER, STUDENT), avatarUrl,
     createdAt, lastSeen, isPasswordSet
   - @Enumerated(EnumType.STRING) для role
   - Lombok: @Data, @NoArgsConstructor, @AllArgsConstructor, @Builder

2. Создать Chat.java:
   - @Entity, @Table(name = "chats")
   - Поля: id, name, type (enum: GROUP, DIRECT, CHANNEL), createdAt,
     createdBy (ManyToOne → User), avatarUrl, description
   - @OneToMany(mappedBy = "chat") для связи с ChatMember
   - Lombok аннотации

3. Создать ChatMember.java:
   - @Entity, @Table(name = "chat_members")
   - Поля: id, user (@ManyToOne → User), chat (@ManyToOne → Chat),
     role (enum: ADMIN, MEMBER), joinedAt, isPinned, isMuted
   - @Table(uniqueConstraints = ...)
   - Lombok аннотации

4. Создать enums: UserRole, ChatType, ChatMemberRole
5. Скомпилировать: ./mvnw compile
6. Commit: "feat: add User, Chat, ChatMember JPA entities"
```

**Важные моменты:**
- Имена таблиц и колонок должны точно совпадать с миграцией V1
- Для `createdAt` использовать `@Column(name = "created_at")` + `@CreationTimestamp`
- Для связей использовать `FetchType.LAZY`

---

#### A.2 Репозитории (Backend)

**Файлы:**
- `backend/src/main/java/com/usm/messenger/repository/UserRepository.java`
- `backend/src/main/java/com/usm/messenger/repository/ChatRepository.java`
- `backend/src/main/java/com/usm/messenger/repository/ChatMemberRepository.java`

**Ход выполнения:**

```
1. Создать UserRepository.java:
   - extends JpaRepository<User, Long>
   - Optional<User> findByIdnp(String idnp)
   - List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(...)

2. Создать ChatRepository.java:
   - extends JpaRepository<Chat, Long>
   - @Query: "SELECT c FROM Chat c JOIN ChatMember cm ON cm.chat = c
     WHERE cm.user.id = :userId"

3. Создать ChatMemberRepository.java:
   - extends JpaRepository<ChatMember, Long>
   - List<ChatMember> findByUserId(Long userId)
   - List<ChatMember> findByChatId(Long chatId)
   - Optional<ChatMember> findByUserIdAndChatId(Long userId, Long chatId)
   - boolean existsByUserIdAndChatId(Long userId, Long chatId)

4. Скомпилировать: ./mvnw compile
5. Commit: "feat: add User, Chat, ChatMember repositories"
```

---

#### A.3 DTO-объекты (Backend)

**Файлы:**
- `backend/src/main/java/com/usm/messenger/dto/response/UserResponse.java`
- `backend/src/main/java/com/usm/messenger/dto/response/ChatListItemResponse.java`
- `backend/src/main/java/com/usm/messenger/dto/response/ChatResponse.java`
- `backend/src/main/java/com/usm/messenger/dto/request/CreateChatRequest.java`

**Ход выполнения:**

```
1. Создать UserResponse — id, idnp, firstName, lastName, email, role, avatarUrl, lastSeen
2. Создать ChatListItemResponse — id, name, type, avatarUrl, lastMessage,
   lastMessageTime, unreadCount, isPinned, isMuted, memberCount
3. Создать ChatResponse — id, name, type, description, avatarUrl, createdAt,
   memberCount, members (List<UserResponse>)
4. Создать CreateChatRequest — name (@NotBlank), type, description, memberIds
5. Commit: "feat: add chat and user DTOs"
```

---

#### A.4 Сервисы и исключения (Backend)

**Файлы:**
- `backend/src/main/java/com/usm/messenger/service/ChatService.java`
- `backend/src/main/java/com/usm/messenger/service/UserService.java`
- `backend/src/main/java/com/usm/messenger/exception/ChatNotFoundException.java`
- `backend/src/main/java/com/usm/messenger/exception/UserNotFoundException.java`
- `backend/src/main/java/com/usm/messenger/exception/AccessDeniedException.java`
- `backend/src/main/java/com/usm/messenger/exception/GlobalExceptionHandler.java`

**Ход выполнения:**

```
1. Создать кастомные исключения (extends RuntimeException)

2. Создать GlobalExceptionHandler (@RestControllerAdvice):
   - ChatNotFoundException → 404
   - AccessDeniedException → 403
   - Exception → 500

3. Создать UserService (@Service):
   - List<UserResponse> getAllUsers()
   - UserResponse getUserById(Long id)
   - List<UserResponse> searchUsers(String query)

4. Создать ChatService (@Service):

   a) List<ChatListItemResponse> getChatsByUserId(Long userId)
      - Получить ChatMember записи для userId
      - Собрать ChatListItemResponse для каждого чата
      - Закреплённые сверху, остальные по lastMessageTime DESC
      - lastMessage и unreadCount — пока null и 0 (Phase 4)

   b) ChatResponse getChatById(Long chatId, Long userId)
      - Проверить что пользователь — участник
      - Вернуть ChatResponse с участниками

   c) ChatResponse createChat(CreateChatRequest request, Long creatorId)
      - Создать Chat, добавить создателя как ADMIN, участников как MEMBER

   d) void pinChat(Long chatId, Long userId, boolean pinned)
   e) void muteChat(Long chatId, Long userId, boolean muted)

5. Commit: "feat: implement ChatService, UserService and exception handling"
```

---

#### A.5 Контроллеры (Backend)

**Файлы:**
- `backend/src/main/java/com/usm/messenger/controller/ChatController.java`
- `backend/src/main/java/com/usm/messenger/controller/UserController.java`

**Ход выполнения:**

```
1. Создать UserController (@RequestMapping("/api/users")):
   a) GET /api/users — все пользователи (для mock-логина и поиска)
   b) GET /api/users/{id} — один пользователь
   c) GET /api/users/search?q={query} — поиск по имени

2. Создать ChatController (@RequestMapping("/api/chats")):
   a) GET /api/chats?userId={userId} → List<ChatListItemResponse>
   b) GET /api/chats/{id}?userId={userId} → ChatResponse
   c) POST /api/chats?userId={userId} + CreateChatRequest → ChatResponse
   d) GET /api/chats/{id}/members → List<UserResponse>
   e) PATCH /api/chats/{id}/pin?userId={userId} + {"pinned": bool}
   f) PATCH /api/chats/{id}/mute?userId={userId} + {"muted": bool}

   Примечание: userId через query param — временно, заменим на JWT в Phase 2.

3. Проверить через Postman:
   - GET /api/users → 4 пользователя
   - GET /api/chats?userId=2 → чаты пользователя Ana
   - POST /api/chats?userId=1 с body → новый чат
4. Commit: "feat: add UserController and ChatController"
```

---

#### A.6 Frontend: типы, API-клиент, стор, хуки (Frontend)

**Файлы:**
- `frontend/src/types/chat.types.ts`
- `frontend/src/api/chats.api.ts`
- `frontend/src/api/users.api.ts`
- `frontend/src/store/chatStore.ts`
- `frontend/src/hooks/useChats.ts`

**Ход выполнения:**

```
1. Создать chat.types.ts:
   - ChatType, ChatMemberRole (type aliases)
   - ChatListItem, ChatDetail, CreateChatRequest (interfaces)

2. Создать chats.api.ts:
   - getMyChats(userId), getChatById(chatId, userId), createChat(data, userId),
     pinChat(...), muteChat(...)

3. Создать users.api.ts:
   - getAllUsers(), getUserById(id), searchUsers(query)

4. Создать chatStore.ts (Zustand):
   - State: chats, activeChatId, isLoading, error
   - Actions: setActiveChat, togglePin, toggleMute

5. Создать useChats.ts (TanStack Query):
   - useChats(userId) → useQuery для списка чатов
   - useChatDetail(chatId) → useQuery для деталей чата
   - useCreateChat() → useMutation

6. Commit: "feat: add chat types, API client, store and hooks"
```

---

#### A.7 Компоненты ChatItem и ChatList (Frontend)

**Файлы:**
- `frontend/src/components/chat/ChatItem.tsx`
- `frontend/src/components/chat/ChatList.tsx`

**Ход выполнения:**

```
1. Создать ChatItem.tsx:
   Props: chat (ChatListItem), isActive (boolean), onClick (function)
   Визуал:
   - Аватар чата (круглый, первая буква если нет картинки)
   - Название чата (font-medium, text-main)
   - Последнее сообщение (text-muted, truncate)
   - Время (text-muted, справа сверху)
   - Badge непрочитанных (accent-red)
   - Иконка pin (если закреплён)
   - Активный чат: bg-primary-light
   - Hover эффект

2. Создать ChatList.tsx:
   - Получает чаты через useChats()
   - Секция «Закреплённые» + остальные
   - Loading state (спиннер)
   - Empty state ("У вас пока нет чатов")
   - Клик по ChatItem → обновить activeChatId в store + navigate

3. Commit: "feat: add ChatItem and ChatList components"
```

---

## Задачи Марии

> **Для Марии**: ниже каждая задача содержит краткую теорию — зачем нужен тот
> или иной подход, как он работает. Это поможет разобраться в используемых
> технологиях по ходу работы. Не стесняйся гуглить термины и задавать вопросы
> Илье!

### Фича B: UI-компоненты, Layout и экран чата

**Суть**: создать визуальную часть мессенджера — базовые переиспользуемые
компоненты, структуру страницы (layout), страницу просмотра чата.

**Результат**: полноценный интерфейс мессенджера — sidebar с чатами слева,
экран чата справа, при этом каждый UI-элемент стилизован и переиспользуем.

---

#### B.1 Базовые UI-компоненты (Frontend)

**Файлы:**
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Avatar.tsx`
- `frontend/src/components/ui/Badge.tsx`
- `frontend/src/components/ui/Spinner.tsx`

##### Немного теории: что такое UI-компонент?

UI-компонент — это маленький переиспользуемый «кирпичик» интерфейса. Например,
кнопка `<Button>` используется на десятке страниц, но написана один раз. Вместо
того чтобы каждый раз писать `<button className="bg-green-800 text-white ...">`,
мы создаём компонент `<Button variant="primary">`, который уже знает, как
выглядеть.

Каждый UI-компонент принимает **props** — это параметры, которые меняют его
внешний вид или поведение. Например, кнопка может быть `variant="primary"`
(зелёная) или `variant="danger"` (красная).

##### Что такое Tailwind CSS?

Tailwind — это CSS-фреймворк, где стили задаются через классы прямо в HTML/JSX.
Вместо написания CSS-файлов, ты добавляешь классы:

```tsx
// Обычный CSS подход:
<button className="my-button">Нажми</button>
// + где-то в .css файле: .my-button { background: green; color: white; ... }

// Tailwind подход (всё в одном месте):
<button className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90">
  Нажми
</button>
```

Часто используемые классы Tailwind:
- `bg-...` — цвет фона (`bg-primary`, `bg-white`, `bg-red-500`)
- `text-...` — цвет и размер текста (`text-white`, `text-sm`, `text-lg`)
- `p-...`, `px-...`, `py-...` — padding (отступ внутри)
- `m-...`, `mx-...`, `my-...` — margin (отступ снаружи)
- `rounded-...` — скругление углов (`rounded-lg`, `rounded-full`)
- `flex`, `items-center`, `justify-between` — flexbox-раскладка
- `hover:...` — стили при наведении мышки
- `w-...`, `h-...` — ширина и высота (`w-10` = 40px, `h-full` = 100%)

##### Что такое clsx и tailwind-merge?

Когда компонент имеет варианты (primary/secondary), нужно менять классы в
зависимости от props. Для этого используется `clsx` — функция, которая удобно
склеивает CSS-классы:

```tsx
import { clsx } from 'clsx';

// clsx('базовые', условие && 'условные', пропс)
className={clsx(
  'px-4 py-2 rounded-lg font-medium',           // всегда
  variant === 'primary' && 'bg-primary text-white',  // если primary
  variant === 'danger' && 'bg-red-500 text-white',   // если danger
)}
```

`tailwind-merge` (`twMerge`) нужна, чтобы при передаче дополнительного
`className` снаружи не возникало конфликтов Tailwind-классов. Обычно
создают утилиту `cn()`:

```tsx
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

##### Ход выполнения: Button.tsx

```
Что должен уметь:
- Выглядеть в нескольких вариантах: primary (зелёный), secondary (серый),
  ghost (прозрачный), danger (красный)
- Иметь разные размеры: sm (маленький), md (обычный), lg (большой)
- Показывать состояние loading (спиннер вместо текста)
- Принимать все стандартные атрибуты HTML-кнопки (onClick, disabled, type...)

Пример использования в другом компоненте:
  <Button variant="primary" size="md" onClick={handleSave}>Сохранить</Button>
  <Button variant="danger" loading>Удаление...</Button>

Как писать:
1. Создать файл frontend/src/components/ui/Button.tsx
2. Определить типы для props:

   interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
     size?: 'sm' | 'md' | 'lg';
     loading?: boolean;
   }

   Слово "extends" здесь означает: "наш компонент принимает ВСЕ стандартные
   props HTML-кнопки (onClick, disabled, type...) ПЛЮС наши кастомные
   (variant, size, loading)."

3. Написать компонент с условными стилями через cn():

   export function Button({ variant = 'primary', size = 'md', loading,
     className, children, disabled, ...rest }: ButtonProps) {
     return (
       <button
         className={cn(
           'inline-flex items-center justify-center font-medium rounded-lg
            transition-colors focus:outline-none focus:ring-2
            focus:ring-primary/50 disabled:opacity-50',
           // Варианты
           variant === 'primary' && 'bg-primary text-white hover:bg-primary/90',
           variant === 'secondary' && 'bg-gray-100 text-text-main hover:bg-gray-200',
           variant === 'ghost' && 'bg-transparent hover:bg-gray-100',
           variant === 'danger' && 'bg-accent-red text-white hover:bg-red-600',
           // Размеры
           size === 'sm' && 'px-3 py-1.5 text-sm',
           size === 'md' && 'px-4 py-2 text-sm',
           size === 'lg' && 'px-6 py-3 text-base',
           className,
         )}
         disabled={disabled || loading}
         {...rest}
       >
         {loading ? <Spinner size="sm" /> : children}
       </button>
     );
   }

4. Проверить: вставить <Button variant="primary">Тест</Button> где-нибудь
   в App.tsx, убедиться что кнопка отображается зелёной.
```

##### Ход выполнения: Input.tsx

```
Что должен уметь:
- Текстовое поле ввода с опциональным label сверху
- Показывать ошибку (красный текст под полем)
- Вариант "search" — с иконкой лупы слева

Как писать:
1. Создать frontend/src/components/ui/Input.tsx
2. Props:

   interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
     label?: string;
     error?: string;
     icon?: React.ReactNode;  // иконка слева (для поиска)
   }

3. Структура JSX:
   <div>
     {label && <label className="block text-sm font-medium mb-1">{label}</label>}
     <div className="relative">
       {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2
         text-text-muted">{icon}</span>}
       <input
         className={cn(
           'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
            focus:border-primary focus:ring-1 focus:ring-primary outline-none',
           icon && 'pl-10',       // если есть иконка — отступ слева побольше
           error && 'border-accent-red',
           className,
         )}
         {...rest}
       />
     </div>
     {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
   </div>

4. Проверить: <Input label="Имя" placeholder="Введите имя" />
```

##### Ход выполнения: Avatar.tsx

```
Что должен уметь:
- Показывать картинку пользователя, если есть URL
- Если URL нет — показать первые буквы имени на цветном фоне
- Разные размеры: sm (32px), md (40px), lg (56px)

Как писать:
1. Создать frontend/src/components/ui/Avatar.tsx
2. Props:

   interface AvatarProps {
     src?: string | null;     // URL картинки (может не быть)
     name: string;            // имя (для генерации букв)
     size?: 'sm' | 'md' | 'lg';
   }

3. Логика:
   - Взять первую букву имени: name.charAt(0).toUpperCase()
   - Если src есть → <img src={src} className="rounded-full ..." />
   - Если нет → <div className="rounded-full bg-primary text-white
       flex items-center justify-center">{initial}</div>
   - Размеры через объект-маппинг:
     const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm',
       lg: 'w-14 h-14 text-lg' };

4. Проверить: <Avatar name="Ana Popescu" size="md" />  → кружок с "A"
```

##### Ход выполнения: Badge.tsx

```
Для отображения количества непрочитанных сообщений (красный кружок с числом).

1. Создать frontend/src/components/ui/Badge.tsx
2. Props:
   interface BadgeProps {
     count: number;
   }
3. Логика:
   - Если count === 0 → return null (ничего не показывать)
   - Если count > 99 → показать "99+"
   - Стиль: bg-accent-red text-white rounded-full text-xs min-w-[20px]
     h-5 flex items-center justify-center px-1.5 font-medium
4. Проверить: <Badge count={5} /> → красный кружок с "5"
```

##### Ход выполнения: Spinner.tsx

```
Простой крутящийся индикатор загрузки.

1. Создать frontend/src/components/ui/Spinner.tsx
2. Props:
   interface SpinnerProps {
     size?: 'sm' | 'md' | 'lg';
   }
3. Использовать CSS-анимацию через Tailwind класс animate-spin:
   <div className={cn(
     'animate-spin rounded-full border-2 border-gray-200 border-t-primary',
     size === 'sm' && 'w-4 h-4',
     size === 'md' && 'w-6 h-6',
     size === 'lg' && 'w-10 h-10',
   )} />
4. Проверить: <Spinner size="md" /> → крутящийся кружок
```

##### Не забыть: утилита cn()

```
Перед созданием компонентов создай файл утилиты:

frontend/src/utils/cn.ts:

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Commit**: `"feat: add base UI components (Button, Input, Avatar, Badge, Spinner)"`

---

#### B.2 UI Store — управление состоянием интерфейса (Frontend)

**Файл**: `frontend/src/store/uiStore.ts`

##### Немного теории: что такое Zustand?

Zustand — это библиотека для **глобального состояния** (state management) в
React. Обычно React-компоненты хранят данные в своём локальном состоянии
(`useState`), но иногда одни и те же данные нужны в разных местах приложения.
Например, модальное окно создания чата открывается кнопкой в Sidebar, но
сам компонент модалки живёт отдельно. Оба должны «знать», открыта модалка
или нет.

Zustand создаёт **store** (хранилище) — объект с данными и функциями для их
изменения. Любой компонент может читать данные из store и вызывать функции.

```tsx
// Создание store:
import { create } from 'zustand';

const useCounterStore = create((set) => ({
  count: 0,                              // данные
  increment: () => set((state) => ({     // функция для изменения
    count: state.count + 1
  })),
}));

// Использование в компоненте:
function MyComponent() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  return <button onClick={increment}>Клики: {count}</button>;
}
```

##### Ход выполнения

```
1. Создать frontend/src/store/uiStore.ts:

   import { create } from 'zustand';

   interface UiState {
     isCreateChatModalOpen: boolean;
     openCreateChatModal: () => void;
     closeCreateChatModal: () => void;
   }

   export const useUiStore = create<UiState>((set) => ({
     isCreateChatModalOpen: false,
     openCreateChatModal: () => set({ isCreateChatModalOpen: true }),
     closeCreateChatModal: () => set({ isCreateChatModalOpen: false }),
   }));

2. Проверить: временно добавить в любой компонент кнопку, которая вызывает
   openCreateChatModal(), и вывести значение isCreateChatModalOpen через
   console.log — убедиться, что значение меняется.
3. Commit: "feat: add UI Zustand store"
```

---

#### B.3 MainLayout — структура страницы мессенджера (Frontend)

**Файл**: `frontend/src/components/layout/MainLayout.tsx`

##### Немного теории: что такое Layout?

Layout — это «каркас» страницы, который определяет, где что расположено.
В мессенджере layout — это две колонки: слева sidebar со списком чатов,
справа — область просмотра чата:

```
┌──────────────────────────────────────────────┐
│  Sidebar (320px)  │     Chat Area            │
│                   │                          │
│  [USMchat    +]   │  (здесь будет ChatPage   │
│  [🔍 Поиск]      │   или NoChatSelected)    │
│  [Чат 1      ]   │                          │
│  [Чат 2      ]   │                          │
│  [Чат 3      ]   │                          │
│                   │                          │
│  [👤 User    ⚙]   │                          │
└──────────────────────────────────────────────┘
```

Layout оборачивает содержимое страницы. В React Router есть концепция
**вложенных маршрутов** — layout содержит `<Outlet />`, куда React Router
подставляет нужную страницу:

```
/chat          → MainLayout → Outlet показывает NoChatSelected
/chat/1        → MainLayout → Outlet показывает ChatPage для чата #1
/chat/2        → MainLayout → Outlet показывает ChatPage для чата #2
```

Это реализуется через `<Outlet />` из `react-router-dom`:

```tsx
import { Outlet } from 'react-router-dom';

function MainLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />                          {/* всегда слева */}
      <main className="flex-1">
        <Outlet />                         {/* сюда подставляется страница */}
      </main>
    </div>
  );
}
```

##### Ход выполнения

```
1. Создать frontend/src/components/layout/MainLayout.tsx:

   import { Outlet } from 'react-router-dom';
   import { Sidebar } from './Sidebar';

   export function MainLayout() {
     return (
       <div className="flex h-screen bg-background">
         <Sidebar />
         <main className="flex-1 flex flex-col">
           <Outlet />
         </main>
       </div>
     );
   }

   Разбор стилей:
   - flex → располагает Sidebar и main горизонтально (в ряд)
   - h-screen → высота = 100% экрана
   - bg-background → фон #F5F5F5 (из Tailwind конфига)
   - flex-1 → main занимает всё оставшееся место (после Sidebar)

2. Попросить Илью обновить App.tsx (или сделать самой), чтобы маршруты
   были вложенными:

   <Route path="/chat" element={<MainLayout />}>
     <Route index element={<NoChatSelected />} />
     <Route path=":chatId" element={<ChatPage />} />
   </Route>

3. Пока Sidebar и ChatPage не готовы — можно поставить заглушки:
   - Sidebar: <div className="w-80 bg-white border-r p-4">Sidebar</div>
   - NoChatSelected: <div className="flex-1 flex items-center
       justify-center text-text-muted">Выберите чат</div>

4. Проверить: зайти на /chat — увидеть две колонки
5. Commit: "feat: add MainLayout component"
```

---

#### B.4 Sidebar — боковая панель (Frontend)

**Файл**: `frontend/src/components/layout/Sidebar.tsx`

##### Немного теории: как устроена структура компонента

Sidebar состоит из трёх секций, расположенных вертикально:

```
┌────────────────────┐
│  USMchat     [+]   │  ← Header (фиксирован сверху)
├────────────────────┤
│  [🔍 Поиск...]     │  ← Поиск
├────────────────────┤
│                    │
│  ChatList          │  ← Список чатов (прокручивается)
│  (компонент Ильи)  │
│                    │
├────────────────────┤
│  [👤 Ana Popescu]  │  ← Профиль текущего пользователя (фиксирован внизу)
└────────────────────┘
```

Чтобы средняя часть прокручивалась, а верх и низ оставались на месте,
используем flexbox:

```tsx
<div className="flex flex-col h-full">     {/* колонка на всю высоту */}
  <header>...</header>                      {/* фиксирован сверху */}
  <div className="flex-1 overflow-y-auto">  {/* прокручивается */}
    <ChatList />
  </div>
  <footer>...</footer>                      {/* фиксирован внизу */}
</div>
```

- `flex-col` — располагает элементы вертикально (сверху вниз)
- `h-full` — высота 100% родителя
- `flex-1` — занять всё свободное место (между header и footer)
- `overflow-y-auto` — если содержимого больше, чем вмещается, появится
  вертикальный скролл

##### Ход выполнения

```
1. Создать frontend/src/components/layout/Sidebar.tsx:

   import { Plus } from 'lucide-react';
   import { useUiStore } from '../../store/uiStore';
   import { useAuthStore } from '../../store/authStore';
   import { Avatar } from '../ui/Avatar';
   import { Input } from '../ui/Input';

   export function Sidebar() {
     const openCreateChatModal = useUiStore(s => s.openCreateChatModal);
     const user = useAuthStore(s => s.user);

     return (
       <aside className="w-80 bg-white border-r border-gray-200
         flex flex-col h-full">

         {/* Header */}
         <div className="p-4 flex items-center justify-between
           border-b border-gray-100">
           <h1 className="text-xl font-semibold text-text-main">USMchat</h1>
           <button onClick={openCreateChatModal}
             className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
             <Plus size={20} />
           </button>
         </div>

         {/* Список чатов (прокручивается) */}
         <div className="flex-1 overflow-y-auto">
           {/* Пока заглушка — потом здесь будет <ChatList /> от Ильи */}
           <div className="p-4 text-text-muted text-sm">
             Загрузка чатов...
           </div>
         </div>

         {/* Профиль внизу */}
         {user && (
           <div className="p-4 border-t border-gray-100 flex items-center gap-3">
             <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
             <div>
               <p className="text-sm font-medium text-text-main">
                 {user.firstName} {user.lastName}
               </p>
               <p className="text-xs text-text-muted">{user.role}</p>
             </div>
           </div>
         )}
       </aside>
     );
   }

2. Подключить в MainLayout (заменить заглушку на <Sidebar />)

3. Заглушка вместо ChatList:
   Пока Илья не сделал ChatList (A.7), в Sidebar стоит текст-заглушка
   "Загрузка чатов...". Когда ChatList будет готов, заменить заглушку на:
     import { ChatList } from '../chat/ChatList';
     ...
     <ChatList />

4. Проверить: зайти на /chat — sidebar показывается слева с заголовком
   USMchat, кнопкой "+", и именем пользователя внизу.
5. Commit: "feat: add Sidebar component"
```

---

#### B.5 Страница «Чат не выбран» (Frontend)

**Файл**: `frontend/src/pages/NoChatSelected.tsx`

##### Что это?

Это страница, которая показывается в правой части экрана, когда пользователь
ещё не кликнул ни на один чат. Простое сообщение по центру: «Выберите чат».

##### Ход выполнения

```
1. Создать frontend/src/pages/NoChatSelected.tsx:

   import { MessageSquare } from 'lucide-react';

   export function NoChatSelected() {
     return (
       <div className="flex-1 flex flex-col items-center justify-center
         text-text-muted">
         <MessageSquare size={64} strokeWidth={1} className="mb-4" />
         <h2 className="text-xl font-medium mb-2">Выберите чат</h2>
         <p className="text-sm">Выберите чат из списка слева для начала общения</p>
       </div>
     );
   }

   Разбор стилей:
   - flex-1 → занимает всё доступное пространство
   - flex flex-col items-center justify-center → содержимое по центру
     (и по горизонтали, и по вертикали)
   - lucide-react — библиотека иконок, MessageSquare — иконка «сообщение»

2. Подключить как маршрут в App.tsx:
   <Route path="/chat" element={<MainLayout />}>
     <Route index element={<NoChatSelected />} />   ← эта строка
   </Route>

   "index" означает: показать этот компонент, когда URL = "/chat"
   (без дополнительного пути вроде /chat/1)

3. Проверить: зайти на /chat → в правой части экрана иконка и текст
4. Commit: "feat: add NoChatSelected page"
```

---

#### B.6 Страница чата — ChatPage и ChatHeader (Frontend)

**Файлы:**
- `frontend/src/pages/ChatPage.tsx`
- `frontend/src/components/chat/ChatHeader.tsx`

##### Немного теории: как React Router передаёт параметры

Когда пользователь кликает на чат из списка, URL меняется, например, на
`/chat/3`. Цифра `3` — это ID чата. React Router позволяет получить это
значение через хук `useParams()`:

```tsx
import { useParams } from 'react-router-dom';

function ChatPage() {
  const { chatId } = useParams();  // chatId = "3" (строка!)
  // Чтобы использовать как число:
  const numericId = Number(chatId);  // numericId = 3
}
```

Это работает, потому что в маршруте мы написали `:chatId`:
```tsx
<Route path=":chatId" element={<ChatPage />} />
```

Двоеточие `:` перед именем означает «это динамический параметр».

##### Немного теории: TanStack Query

TanStack Query (раньше назывался React Query) — библиотека, которая упрощает
загрузку данных с сервера. Вместо того чтобы вручную писать `useState` +
`useEffect` + `fetch` + обработку ошибок + loading, ты пишешь один хук:

```tsx
// Без TanStack Query (много кода):
const [chat, setChat] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch(`/api/chats/${chatId}`)
    .then(res => res.json())
    .then(data => { setChat(data); setLoading(false); })
    .catch(err => { setError(err); setLoading(false); });
}, [chatId]);

// С TanStack Query (одна строка):
const { data: chat, isLoading, error } = useQuery({
  queryKey: ['chat', chatId],
  queryFn: () => chatsApi.getChatById(chatId, userId).then(res => res.data),
});
```

TanStack Query сам управляет loading/error, кэширует данные, обновляет их
в фоне — нам нужно только указать, откуда загружать.

##### Ход выполнения: ChatHeader.tsx

```
Это верхняя полоска экрана чата с названием и информацией:

┌─────────────────────────────────────────────┐
│  [🟢] Programare Web          [🔍] [⋮]     │
│       4 участника                           │
└─────────────────────────────────────────────┘

1. Создать frontend/src/components/chat/ChatHeader.tsx:

   import { Search, MoreVertical } from 'lucide-react';
   import { Avatar } from '../ui/Avatar';
   import type { ChatDetail } from '../../types/chat.types';

   interface ChatHeaderProps {
     chat: ChatDetail;
   }

   export function ChatHeader({ chat }: ChatHeaderProps) {
     return (
       <header className="h-16 px-4 flex items-center justify-between
         border-b border-gray-200 bg-white">

         <div className="flex items-center gap-3">
           <Avatar name={chat.name} src={chat.avatarUrl} size="md" />
           <div>
             <h2 className="font-medium text-text-main">{chat.name}</h2>
             <p className="text-xs text-text-muted">
               {chat.memberCount} участник(ов)
             </p>
           </div>
         </div>

         <div className="flex items-center gap-1">
           <button className="p-2 rounded-lg hover:bg-gray-100">
             <Search size={18} className="text-text-muted" />
           </button>
           <button className="p-2 rounded-lg hover:bg-gray-100">
             <MoreVertical size={18} className="text-text-muted" />
           </button>
         </div>
       </header>
     );
   }

2. Кнопки поиска и меню пока ничего не делают — это заглушки для будущих фаз.
```

##### Ход выполнения: ChatPage.tsx

```
1. Создать frontend/src/pages/ChatPage.tsx:

   import { useParams } from 'react-router-dom';
   import { useQuery } from '@tanstack/react-query';
   import { chatsApi } from '../api/chats.api';
   import { useAuthStore } from '../store/authStore';
   import { ChatHeader } from '../components/chat/ChatHeader';
   import { Spinner } from '../components/ui/Spinner';

   export function ChatPage() {
     const { chatId } = useParams();
     const user = useAuthStore(s => s.user);

     const { data: chat, isLoading, error } = useQuery({
       queryKey: ['chat', chatId],
       queryFn: () => chatsApi.getChatById(Number(chatId), user!.id)
         .then(res => res.data),
       enabled: !!chatId && !!user,
     });

     if (isLoading) {
       return (
         <div className="flex-1 flex items-center justify-center">
           <Spinner size="lg" />
         </div>
       );
     }

     if (error || !chat) {
       return (
         <div className="flex-1 flex items-center justify-center text-accent-red">
           Ошибка загрузки чата
         </div>
       );
     }

     return (
       <div className="flex-1 flex flex-col">
         <ChatHeader chat={chat} />

         {/* Область сообщений — заглушка до Phase 4 */}
         <div className="flex-1 flex items-center justify-center text-text-muted">
           <p>Сообщения появятся в следующей фазе</p>
         </div>

         {/* Поле ввода — заглушка до Phase 4 */}
         <div className="p-4 border-t border-gray-200 bg-white">
           <input
             disabled
             placeholder="Отправка сообщений в разработке..."
             className="w-full rounded-lg border border-gray-200 px-4 py-3
               text-sm bg-gray-50 text-text-muted cursor-not-allowed"
           />
         </div>
       </div>
     );
   }

   Что здесь происходит:
   - useParams() → получаем chatId из URL
   - useAuthStore → получаем текущего пользователя
   - useQuery → загружаем детали чата с сервера
   - enabled: !!chatId && !!user → запрос отправляется ТОЛЬКО когда оба
     значения есть (!! преобразует к boolean)
   - Три состояния: загрузка (спиннер), ошибка (текст), данные (контент)

2. Подключить в App.tsx как маршрут:
   <Route path="/chat" element={<MainLayout />}>
     <Route index element={<NoChatSelected />} />
     <Route path=":chatId" element={<ChatPage />} />  ← эта строка
   </Route>

3. Проверить: после того как Илья сделает backend (A.5), зайти на
   /chat/1 — увидеть заголовок "Programare Web, 4 участника" и заглушки.
4. Commit: "feat: add ChatPage and ChatHeader"
```

---

#### B.7 Модалка создания чата (Frontend)

**Файл**: `frontend/src/components/chat/CreateChatModal.tsx`

##### Немного теории: что такое модальное окно?

Модальное окно (modal) — это всплывающее окно поверх основного контента.
За ним обычно есть полупрозрачный тёмный фон (overlay), который блокирует
клики по основной странице. Пользователь должен либо выполнить действие
в модалке, либо закрыть её.

Структура в JSX:

```tsx
{isOpen && (
  <div className="fixed inset-0 z-50">                    {/* Контейнер */}
    <div className="absolute inset-0 bg-black/50"          {/* Overlay */}
      onClick={onClose} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2
      -translate-y-1/2 bg-white rounded-xl p-6 w-[480px]"> {/* Карточка */}
      {/* содержимое */}
    </div>
  </div>
)}
```

- `fixed inset-0` — растягивает элемент на весь экран
- `z-50` — поверх всего остального
- `bg-black/50` — чёрный фон с 50% прозрачности
- `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` —
  центрирование карточки

##### Немного теории: useState для формы

В React для управления формой используется `useState`. Каждое поле формы
хранит значение в state, и обновляется при каждом вводе:

```tsx
const [name, setName] = useState('');

<input
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Название чата"
/>
```

`e.target.value` — это текущий текст в поле ввода. При каждом нажатии
клавиши React вызывает `setName` с новым значением, компонент
перерисовывается, и поле показывает обновлённый текст.

##### Ход выполнения

```
Что должна уметь модалка:
- Поле «Название чата» (обязательное)
- Поле «Описание» (необязательное)
- Кнопки «Отмена» и «Создать»
- При нажатии «Создать»: отправить POST /api/chats, закрыть модалку

Поиск и добавление участников пока НЕ делаем (это усложнение).
Чат создаётся пустой — участников можно добавить позже.

1. Создать frontend/src/components/chat/CreateChatModal.tsx:

   import { useState } from 'react';
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { chatsApi } from '../../api/chats.api';
   import { useAuthStore } from '../../store/authStore';
   import { useUiStore } from '../../store/uiStore';
   import { Button } from '../ui/Button';
   import { Input } from '../ui/Input';

   export function CreateChatModal() {
     const isOpen = useUiStore(s => s.isCreateChatModalOpen);
     const closeModal = useUiStore(s => s.closeCreateChatModal);
     const user = useAuthStore(s => s.user);
     const queryClient = useQueryClient();

     const [name, setName] = useState('');
     const [description, setDescription] = useState('');

     const createMutation = useMutation({
       mutationFn: () => chatsApi.createChat(
         { name, type: 'GROUP', description, memberIds: [] },
         user!.id
       ),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['chats'] });
         setName('');
         setDescription('');
         closeModal();
       },
     });

     if (!isOpen) return null;

     return (
       <div className="fixed inset-0 z-50">
         <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2
           -translate-y-1/2 bg-white rounded-xl p-6 w-[480px] shadow-xl">
           <h2 className="text-lg font-semibold mb-4">Создать чат</h2>
           <div className="space-y-4">
             <Input
               label="Название чата"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Например: Programare Web"
             />
             <div>
               <label className="block text-sm font-medium mb-1">Описание</label>
               <textarea
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Необязательно"
                 rows={3}
                 className="w-full rounded-lg border border-gray-200 px-3 py-2
                   text-sm focus:border-primary focus:ring-1 focus:ring-primary
                   outline-none resize-none"
               />
             </div>
           </div>
           <div className="flex justify-end gap-3 mt-6">
             <Button variant="ghost" onClick={closeModal}>Отмена</Button>
             <Button
               variant="primary"
               onClick={() => createMutation.mutate()}
               disabled={!name.trim()}
               loading={createMutation.isPending}
             >
               Создать
             </Button>
           </div>
         </div>
       </div>
     );
   }

   Что здесь происходит:
   - useState для name и description — хранят текст из полей
   - useMutation — хук TanStack Query для отправки POST-запроса
   - invalidateQueries — после создания чата говорит TanStack Query
     «данные о списке чатов устарели, загрузи заново»
   - if (!isOpen) return null — если модалка закрыта, ничего не рендерим

2. Подключить модалку в MainLayout (или App.tsx):
   import { CreateChatModal } from '../chat/CreateChatModal';
   ...
   <CreateChatModal />

   Модалка сама проверяет isOpen из store — если false, не показывается.

3. Проверить: нажать "+" в Sidebar → модалка открывается → ввести название →
   «Создать» → модалка закрывается → в списке чатов появился новый чат.
4. Commit: "feat: add CreateChatModal component"
```

---

#### B.8 Backend: эндпоинт поиска пользователей (Backend)

**Файл**: `backend/src/main/java/com/usm/messenger/controller/UserController.java`

##### Немного теории: как устроен Spring Boot контроллер

В Spring Boot **контроллер** — это Java-класс, который принимает HTTP-запросы
и возвращает ответы. Каждый метод контроллера привязан к определённому URL
(эндпоинту) и HTTP-методу (GET, POST, и т.д.):

```java
@RestController                        // Это REST-контроллер
@RequestMapping("/api/users")          // Базовый путь для всех методов
public class UserController {

    @GetMapping("/search")             // GET /api/users/search
    public List<UserResponse> search(
        @RequestParam String q          // ?q=Ana — параметр из URL
    ) {
        return userService.searchUsers(q);
    }
}
```

Аннотации:
- `@RestController` — говорит Spring: «это контроллер, возвращает JSON»
- `@RequestMapping("/api/users")` — базовый путь
- `@GetMapping("/search")` — этот метод обрабатывает `GET /api/users/search`
- `@RequestParam String q` — берёт значение из `?q=...` в URL
- Spring автоматически преобразует возвращаемый объект в JSON

##### Зачем это нужно?

Мария делает модалку создания чата. Чтобы добавлять участников, нужен поиск
пользователей. Но для MVP (первой версии) мы упростили модалку — участники
не добавляются при создании. Однако эндпоинт поиска пользователей всё равно
пригодится в будущем.

> **Примечание**: Илья создаёт UserController в задаче A.5. Если Мария
> берётся за эту задачу первой — она создаёт контроллер, и Илья добавляет
> в него остальные методы. Если Илья уже создал — Мария добавляет метод
> поиска. **Договоритесь, кто создаёт файл первым, чтобы не было
> конфликтов в Git.**

##### Ход выполнения

```
1. Если UserController.java ещё не создан — создать:

   @RestController
   @RequestMapping("/api/users")
   @RequiredArgsConstructor
   public class UserController {

       private final UserService userService;

       @GetMapping("/search")
       public List<UserResponse> searchUsers(@RequestParam String q) {
           return userService.searchUsers(q);
       }
   }

2. Если UserService.searchUsers() ещё не реализован — добавить:

   public List<UserResponse> searchUsers(String query) {
       List<User> users = userRepository
           .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
               query, query);
       return users.stream()
           .map(this::toUserResponse)     // преобразовать User → UserResponse
           .toList();
   }

3. Проверить через Postman:
   GET http://localhost:8080/api/users/search?q=Ana
   Ожидание: JSON массив с пользователем Ana Popescu

4. Commit: "feat: add user search endpoint"
```

---

#### B.9 Frontend: API-клиент для пользователей (Frontend)

**Файл**: `frontend/src/api/users.api.ts`

##### Немного теории: что такое API-клиент?

API-клиент — это набор функций, которые отправляют HTTP-запросы к серверу.
Вместо того чтобы в каждом компоненте писать URL, метод, параметры — мы
выносим это в отдельный файл. Компоненты вызывают функцию, не зная деталей
запроса:

```tsx
// Плохо — URL и параметры размазаны по компонентам:
const response = await axios.get('http://localhost:8080/api/users/search',
  { params: { q: 'Ana' } });

// Хорошо — API-клиент:
const response = await usersApi.searchUsers('Ana');
```

Проект уже использует `axios` — HTTP-клиент, который умеет автоматически
преобразовывать ответы в JSON. Настроенный экземпляр axios (`apiClient`)
уже есть в `src/api/axios.ts`.

##### Ход выполнения

```
1. Создать frontend/src/api/users.api.ts:

   import { apiClient } from './axios';
   import type { User } from '../types/user.types';

   export const usersApi = {
     getAllUsers: () =>
       apiClient.get<User[]>('/users'),

     getUserById: (id: number) =>
       apiClient.get<User>(`/users/${id}`),

     searchUsers: (query: string) =>
       apiClient.get<User[]>('/users/search', { params: { q: query } }),
   };

   Что здесь происходит:
   - apiClient.get<User[]>('/users') — GET-запрос к /api/users
     (baseURL из axios.ts уже содержит /api)
   - <User[]> — TypeScript generic, говорит: «ответ — массив User»
   - { params: { q: query } } — добавляет ?q=... к URL

2. Проверить: временно вызвать в каком-нибудь компоненте:
   useEffect(() => {
     usersApi.getAllUsers().then(res => console.log(res.data));
   }, []);
   Открыть DevTools → Console → увидеть массив пользователей.

3. Commit: "feat: add users API client"
```

---

## Интеграция и тестирование

### День 4–5: совместная проверка

**Кто**: оба

#### Шаг 1: Подключение ChatList в Sidebar

Когда Илья закончит ChatList (A.7), Мария заменяет заглушку в Sidebar:

```tsx
// Было:
<div className="p-4 text-text-muted text-sm">Загрузка чатов...</div>

// Стало:
import { ChatList } from '../chat/ChatList';
...
<ChatList />
```

#### Шаг 2: Подключение CreateChatModal

Добавить `<CreateChatModal />` в MainLayout, чтобы модалка была доступна.

#### Шаг 3: Полный прогон

```
1. Запустить стек: docker-compose up --build
2. Открыть http://localhost:3000
3. Чеклист:
   [ ] Страница выбора пользователя → выбрать Ana → войти
   [ ] Sidebar: видны 3 чата Ana (Programare Web, Baze de Date, Matematica)
   [ ] Клик на чат → ChatHeader с названием и количеством участников
   [ ] Клик на "+" → модалка создания чата
   [ ] Создать новый чат → он появляется в списке
   [ ] Обновить страницу → пользователь сохранён, чаты загружаются
   [ ] DevTools → Network: все запросы 200, нет CORS-ошибок
   [ ] DevTools → Console: нет ошибок
```

#### Шаг 4: Баг-фиксы

```
1. Исправить найденные баги
2. Добавить loading/error states где пропущены
3. Убедиться что всё работает при разных пользователях (выйти → войти
   под другим → увидеть другие чаты)
4. Финальный commit + push в development
```

---

## Зависимости между задачами

```
Илья                              Мария
─────────                         ─────────
0.1 Fix миграции                  B.1 UI-компоненты (параллельно!)
0.2 Fix CORS                      B.2 uiStore
0.3 Fix App.tsx + index.html      │
0.4 Seed data                     │
0.5 Mock auth (BE + FE)           │
│                                 B.3 MainLayout (нужен App.tsx от 0.3)
│                                 B.4 Sidebar (нужен authStore от 0.5)
A.1 JPA Entities                  B.5 NoChatSelected
A.2 Repositories                  │
A.3 DTOs                          │
A.4 Services ─────────────────┐   │
A.5 Controllers ──────────────┤   B.6 ChatPage + ChatHeader
│                             │       (нужен GET /api/chats/{id} от A.5)
A.6 FE: types, API, store,   │   B.7 CreateChatModal
     hooks                    │       (нужен POST /api/chats от A.5)
A.7 ChatItem + ChatList ──────┘   B.8 User search endpoint (backend)
                                  B.9 users.api.ts

                    ↓ ИНТЕГРАЦИЯ ↓

           Подключить ChatList в Sidebar
           Подключить CreateChatModal
           Полный прогон + баг-фиксы

Ключевые зависимости:
• Мария начинает B.1–B.5 ПАРАЛЛЕЛЬНО с Ильёй — зависимостей нет
• B.4 (Sidebar) нужен authStore (0.5) — Илья делает на день 1
• B.6 (ChatPage) нужен backend API (A.5) — Илья делает на день 2–3
• B.7 (CreateChatModal) нужен POST /api/chats (A.5) — аналогично
• B.4 (Sidebar) использует ChatList (A.7) — пока заглушка,
  подключаем при интеграции
```

---

## Рекомендуемый порядок по дням

| День | Илья | Мария |
|------|------|-------|
| 1 | 0.1 Fix миграции, 0.2 Fix CORS, 0.3 Fix App.tsx, 0.4 Seed data, 0.5 Mock auth | B.1 UI-компоненты (Button, Input, Avatar, Badge, Spinner) + cn() утилита |
| 2 | A.1 Entities, A.2 Repos, A.3 DTOs | B.2 uiStore, B.3 MainLayout, B.4 Sidebar, B.5 NoChatSelected |
| 3 | A.4 Services, A.5 Controllers | B.6 ChatPage + ChatHeader, B.8 User search endpoint |
| 4 | A.6 FE types/API/store/hooks, A.7 ChatItem + ChatList | B.7 CreateChatModal, B.9 users.api.ts |
| 5 | Интеграция: подключить ChatList → Sidebar, полный прогон, баг-фиксы | Интеграция: подключить CreateChatModal, тестирование, баг-фиксы |

---

## Критерии готовности фазы

- [ ] Backend: GET /api/users, GET /api/users/search?q=, GET /api/users/{id}
- [ ] Backend: GET /api/chats?userId=, GET /api/chats/{id}?userId=, POST /api/chats?userId=
- [ ] Backend: GET /api/chats/{id}/members, PATCH pin, PATCH mute
- [ ] Frontend: mock-логин (выбор пользователя из списка)
- [ ] Frontend: MainLayout (sidebar + chat area)
- [ ] Frontend: список чатов загружается и отображается
- [ ] Frontend: при клике на чат — ChatPage с ChatHeader
- [ ] Frontend: модалка создания чата работает
- [ ] Frontend: страница NoChatSelected при отсутствии выбранного чата
- [ ] Frontend: все UI-компоненты созданы и стилизованы (Button, Input, Avatar, Badge, Spinner)
- [ ] Интеграция: фронтенд и бэкенд работают вместе
- [ ] Код: нет ошибок в консоли, нет ESLint/TypeScript warnings
- [ ] Git: все изменения в ветке development
