# Фаза 1: Инициализация проекта USMchat

**Сроки**: 1-2 дня  
**Цель**: Настроить инфраструктуру проекта, чтобы оба разработчика могли начать работу над функционалом

---

## 📋 Разделение задач

| Разработчик | Задачи |
|-------------|--------|
| **Backend** | Spring Boot проект, PostgreSQL, структура пакетов, базовая конфигурация |
| **Frontend** | Vite + React + TypeScript, Tailwind CSS, структура папок, роутинг |
| **Общее** | Docker Compose, .env файлы, Git репозиторий |

---

## 🎯 Чеклист Фазы 1

### Backend
- [ ] Создание Spring Boot проекта через Spring Initializr
- [ ] Настройка структуры пакетов
- [ ] Подключение PostgreSQL (Docker)
- [ ] Настройка Flyway миграций
- [ ] Базовая конфигурация (CORS, базовая безопасность)
- [ ] Тестовый endpoint для проверки

### Frontend
- [ ] Создание Vite + React + TypeScript проекта
- [ ] Настройка Tailwind CSS
- [ ] Настройка ESLint + Prettier
- [ ] Базовая структура папок
- [ ] Настройка React Router
- [ ] Базовая layout структура

### DevOps
- [ ] Docker Compose для PostgreSQL
- [ ] .env файлы (.env.example)
- [ ] .gitignore настроен
- [ ] README с инструкциями

---

# 🔧 Инструкция для Backend разработчика

## Шаг 1: Проверка окружения

Убедись, что установлено:

```powershell
# Проверка Java (нужна версия 21 или выше)
java -version
# Должно быть: openjdk version "21.x.x"

# Проверка Maven (необязательно, будем использовать mvnw)
mvn -version

# Проверка Docker
docker --version

# Проверка Git
git --version
```

**Если Java не установлена:**
1. Скачай [Amazon Corretto 21](https://docs.aws.amazon.com/corretto/latest/corretto-21-ug/downloads-list.html) или [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#java21)
2. Установи и проверь: `java -version`

**Если Docker не установлен:**
1. Скачай [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Установи и запусти Docker Desktop

---

## Шаг 2: Создание Spring Boot проекта

### Вариант А: Через Spring Initializr Web (проще)

1. Открой https://start.spring.io/
2. Настрой параметры:

```
Project: Maven
Language: Java
Spring Boot: 3.2.2 (или последняя стабильная 3.2.x)
Project Metadata:
  - Group: com.usm
  - Artifact: messenger
  - Name: usm-messenger
  - Description: USM Messenger for university communication
  - Package name: com.usm.messenger
  - Packaging: Jar
  - Java: 21
```

3. Добавь зависимости (Dependencies):
   - **Spring Web** (для REST API)
   - **Spring Security** (для аутентификации)
   - **Spring Data JPA** (для работы с БД)
   - **PostgreSQL Driver** (драйвер БД)
   - **Lombok** (уменьшает boilerplate код)
   - **Validation** (валидация данных)
   - **Spring WebSocket** (для real-time)
   - **Flyway Migration** (миграции БД)

4. Нажми **Generate** → скачается `usm-messenger.zip`

5. Распакуй архив в папку `backend`:

```powershell
# Перейди в корень проекта
cd "D:\Delevopment Workspace\Workflow\usm-messenger"

# Создай папку backend, если её нет
mkdir backend

# Распакуй содержимое zip в папку backend
# (используй проводник или архиватор)
```

### Вариант Б: Через командную строку (для продвинутых)

```powershell
# Генерация проекта через curl (нужен curl.exe в Windows 10+)
curl https://start.spring.io/starter.zip `
  -d type=maven-project `
  -d language=java `
  -d bootVersion=3.2.2 `
  -d groupId=com.usm `
  -d artifactId=messenger `
  -d name=usm-messenger `
  -d description="USM Messenger" `
  -d packageName=com.usm.messenger `
  -d packaging=jar `
  -d javaVersion=21 `
  -d dependencies=web,security,data-jpa,postgresql,lombok,validation,websocket,flyway `
  -o backend.zip

# Распаковать
Expand-Archive -Path backend.zip -DestinationPath backend
```

---

## Шаг 3: Настройка структуры пакетов

После генерации проекта структура будет примерно такая:

```
backend/
├── src/main/java/com/usm/messenger/
│   └── UsmMessengerApplication.java
└── src/main/resources/
    └── application.properties
```

**Создай структуру пакетов:**

```powershell
cd backend/src/main/java/com/usm/messenger

# Создание пакетов (PowerShell)
mkdir config, controller, service, repository, entity, dto, security, exception, mapper, websocket

# В dto создай подпапки
cd dto
mkdir request, response
cd ../../..
```

**Итоговая структура:**

```
src/main/java/com/usm/messenger/
├── UsmMessengerApplication.java
├── config/          # Конфигурация (Security, CORS, WebSocket)
├── controller/      # REST endpoints
├── service/         # Бизнес-логика
├── repository/      # JPA репозитории
├── entity/          # JPA сущности (User, Chat, Message)
├── dto/
│   ├── request/     # DTO для входящих запросов
│   └── response/    # DTO для ответов
├── security/        # JWT, фильтры, UserDetails
├── exception/       # Кастомные исключения
├── mapper/          # MapStruct мапперы
└── websocket/       # WebSocket handlers
```

---

## Шаг 4: Запуск PostgreSQL через Docker

### 4.1 Создай Docker Compose файл

В корне проекта (не в backend!) создай файл `docker-compose.yml`:

```powershell
# Перейди в корень проекта
cd "D:\Delevopment Workspace\Workflow\usm-messenger"

# Создай файл (откроется в блокноте)
notepad docker-compose.yml
```

**Содержимое `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: usm-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: usm_messenger
      POSTGRES_USER: usm
      POSTGRES_PASSWORD: usm123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U usm"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

### 4.2 Запусти PostgreSQL

```powershell
# Запуск контейнера (в фоне)
docker-compose up -d postgres

# Проверка, что контейнер запущен
docker ps

# Проверка логов
docker logs usm-postgres

# Подключение к PostgreSQL (опционально, для проверки)
docker exec -it usm-postgres psql -U usm -d usm_messenger
# Внутри psql:
# \l          - список баз
# \dt         - список таблиц (пока пусто)
# \q          - выход
```

---

## Шаг 5: Настройка конфигурации приложения

### 5.1 Удали `application.properties` и создай `application.yml`

```powershell
cd backend/src/main/resources
rm application.properties  # или удали через проводник
notepad application.yml
```

**Содержимое `application.yml`:**

```yaml
spring:
  application:
    name: usm-messenger

  datasource:
    url: jdbc:postgresql://localhost:5432/usm_messenger
    username: usm
    password: usm123
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: none  # Используем Flyway для миграций
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

  security:
    user:
      name: admin
      password: admin  # Временно для тестирования

server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always

logging:
  level:
    com.usm.messenger: DEBUG
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
```

### 5.2 Создай профиль для разработки

```powershell
notepad application-dev.yml
```

**Содержимое `application-dev.yml`:**

```yaml
spring:
  jpa:
    show-sql: true
  
  devtools:
    restart:
      enabled: true

logging:
  level:
    com.usm.messenger: DEBUG
```

---

## Шаг 6: Настройка Flyway миграций

### 6.1 Создай папку для миграций

```powershell
cd backend/src/main/resources
mkdir db
cd db
mkdir migration
```

### 6.2 Создай первую миграцию

```powershell
cd migration
notepad V1__init_schema.sql
```

**Содержимое `V1__init_schema.sql`:**

```sql
-- Создание таблицы пользователей
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

-- Создание таблицы чатов
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    avatar_url VARCHAR(500),
    description TEXT
);

-- Создание таблицы участников чатов
CREATE TABLE IF NOT EXISTS chat_members (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, chat_id)
);

-- Создание таблицы сообщений
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    content TEXT,
    type VARCHAR(20) DEFAULT 'TEXT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    reply_to_id BIGINT REFERENCES messages(id)
);

-- Создание таблицы статусов прочтения
CREATE TABLE IF NOT EXISTS message_read_status (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Создание таблицы вложений
CREATE TABLE IF NOT EXISTS attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT
);

-- Создание таблицы папок пользователя
CREATE TABLE IF NOT EXISTS folders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#24513C'
);

-- Создание таблицы связи чатов и папок
CREATE TABLE IF NOT EXISTS chat_folders (
    folder_id BIGINT REFERENCES folders(id) ON DELETE CASCADE,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    PRIMARY KEY (folder_id, chat_id)
);

-- Создание индексов для оптимизации
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_users_idnp ON users(idnp);

-- Вставка тестовых данных
INSERT INTO users (idnp, first_name, last_name, role, is_password_set) 
VALUES ('2001234567890', 'Admin', 'User', 'ADMIN', false)
ON CONFLICT DO NOTHING;
```

**Почему `V1__init_schema.sql`:**
- `V1` — версия миграции (V2, V3, и т.д.)
- `__` — два подчёркивания (обязательно!)
- `init_schema` — описание миграции

---

## Шаг 7: Базовая конфигурация CORS

Создай файл конфигурации CORS:

```powershell
cd backend/src/main/java/com/usm/messenger/config
notepad CorsConfig.java
```

**Содержимое `CorsConfig.java`:**

```java
package com.usm.messenger.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        config.setAllowCredentials(true);
        config.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://localhost:3000"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setMaxAge(3600L);
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

---

## Шаг 8: Временное отключение Spring Security

Пока создаём базовую настройку, отключим полную аутентификацию:

```powershell
cd backend/src/main/java/com/usm/messenger/config
notepad SecurityConfig.java
```

**Содержимое `SecurityConfig.java`:**

```java
package com.usm.messenger.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // Отключаем CSRF для разработки
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()  // Разрешаем все запросы (временно!)
            );
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

**⚠️ Внимание:** Это временная конфигурация для тестирования! В Фазе 2 настроим полноценную аутентификацию.

---

## Шаг 9: Создание тестового контроллера

Создадим простой контроллер для проверки, что всё работает:

```powershell
cd backend/src/main/java/com/usm/messenger/controller
notepad HealthController.java
```

**Содержимое `HealthController.java`:**

```java
package com.usm.messenger.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("message", "USM Messenger API is running");
        return response;
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}
```

---

## Шаг 10: Создание .env файла

В корне проекта (не в backend!) создай `.env.example`:

```powershell
cd "D:\Delevopment Workspace\Workflow\usm-messenger"
notepad .env.example
```

**Содержимое `.env.example`:**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usm_messenger
DB_USER=usm
DB_PASSWORD=usm123

# Backend
BACKEND_PORT=8080
JWT_SECRET=your-secret-key-change-this-in-production-min-256-bits

# Frontend
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

---

## Шаг 11: Обновление .gitignore

Проверь файл `.gitignore` в папке `backend`:

```powershell
cd backend
notepad .gitignore
```

**Добавь (если нет):**

```gitignore
### Spring Boot ###
target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### STS ###
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### IntelliJ IDEA ###
.idea
*.iws
*.iml
*.ipr

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/

### VS Code ###
.vscode/

### Environment ###
.env
.env.local
application-local.yml

### Logs ###
*.log
```

---

## Шаг 12: Запуск Backend приложения

```powershell
cd backend

# Первый запуск (скачает зависимости)
./mvnw.cmd clean install

# Запуск приложения
./mvnw.cmd spring-boot:run

# Или через PowerShell напрямую
.\mvnw.cmd spring-boot:run
```

**Что должно произойти:**
1. Maven скачает зависимости (~2-5 минут первый раз)
2. Flyway применит миграцию `V1__init_schema.sql`
3. Spring Boot запустится на порту 8080
4. В консоли увидишь:

```
Started UsmMessengerApplication in X.XXX seconds
```

---

## Шаг 13: Проверка работоспособности

### 13.1 Проверка API endpoint

Открой браузер или используй curl:

```powershell
# Проверка health endpoint
curl http://localhost:8080/api/health

# Ожидаемый ответ:
# {"status":"UP","timestamp":"2026-02-04T...","message":"USM Messenger API is running"}

# Проверка ping
curl http://localhost:8080/api/ping
# Ожидаемый ответ: pong
```

### 13.2 Проверка таблиц в базе данных

```powershell
# Подключись к PostgreSQL
docker exec -it usm-postgres psql -U usm -d usm_messenger

# Внутри psql выполни:
\dt
# Должны появиться таблицы: users, chats, chat_members, messages, и т.д.

# Проверка данных в таблице users
SELECT * FROM users;

# Выход
\q
```

---

## Шаг 14: Настройка IDE (IntelliJ IDEA или VS Code)

### Для IntelliJ IDEA:

1. Открой `File → Open` → выбери папку `backend`
2. IDEA автоматически распознает Maven проект
3. Включи Lombok:
   - `File → Settings → Plugins → установи Lombok`
   - `File → Settings → Build → Compiler → Annotation Processors → Enable annotation processing`
4. Запуск: правой кнопкой на `UsmMessengerApplication.java` → Run

### Для VS Code:

1. Установи расширения:
   - Extension Pack for Java
   - Spring Boot Extension Pack
2. Открой папку `backend`
3. Запуск: `F5` или через терминал `./mvnw.cmd spring-boot:run`

---

## ✅ Чеклист для Backend разработчика

После выполнения всех шагов проверь:

- [ ] Java 21 установлена
- [ ] Docker Desktop запущен
- [ ] PostgreSQL контейнер работает (`docker ps`)
- [ ] Spring Boot проект создан со всеми зависимостями
- [ ] Структура пакетов создана
- [ ] Flyway миграция применена (таблицы созданы)
- [ ] CORS конфигурация настроена
- [ ] Security временно отключена
- [ ] Health endpoint работает (`/api/health`)
- [ ] `.gitignore` настроен
- [ ] `.env.example` создан

---

# 🎨 Инструкция для Frontend разработчика

## Шаг 1: Проверка окружения

```powershell
# Проверка Node.js (нужна версия 18+)
node -v
# Должно быть: v18.x.x или v20.x.x

# Проверка npm
npm -v

# Проверка Git
git --version
```

**Если Node.js не установлена:**
1. Скачай [Node.js LTS](https://nodejs.org/) (версия 20.x рекомендуется)
2. Установи и перезапусти PowerShell
3. Проверь: `node -v`

---

## Шаг 2: Создание Vite проекта

```powershell
# Перейди в корень проекта
cd "D:\Delevopment Workspace\Workflow\usm-messenger"

# Создание проекта через Vite
npm create vite@latest frontend -- --template react-ts

# Альтернативный способ (если предыдущий не сработал)
# npm create vite@latest
# Выбери: frontend, React, TypeScript
```

---

## Шаг 3: Установка зависимостей

```powershell
cd frontend

# Установка базовых зависимостей
npm install

# Установка Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Установка библиотек для работы с данными
npm install zustand @tanstack/react-query axios

# Установка роутинга
npm install react-router-dom

# Установка WebSocket клиента
npm install socket.io-client

# Установка утилит для UI
npm install clsx tailwind-merge

# Установка иконок
npm install lucide-react
```

**Что установили:**
- `tailwindcss` — CSS фреймворк для быстрой стилизации
- `zustand` — state management (проще Redux)
- `@tanstack/react-query` — управление серверным состоянием
- `axios` — HTTP клиент для запросов к API
- `react-router-dom` — роутинг между страницами
- `socket.io-client` — WebSocket для real-time сообщений
- `clsx`, `tailwind-merge` — утилиты для классов
- `lucide-react` — набор SVG иконок

---

## Шаг 4: Настройка Tailwind CSS

### 4.1 Инициализация Tailwind

```powershell
npx tailwindcss init -p
```

Создадутся файлы:
- `tailwind.config.js`
- `postcss.config.js`

### 4.2 Настройка Tailwind конфигурации

Замени содержимое `tailwind.config.js`:

```powershell
notepad tailwind.config.js
```

**Содержимое `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
  plugins: [],
}
```

### 4.3 Обновление CSS

Замени содержимое `src/index.css`:

```powershell
notepad src/index.css
```

**Содержимое `src/index.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-text-main;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}
```

### 4.4 Установка шрифта Inter (опционально)

Открой `index.html` и добавь в `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Шаг 5: Создание структуры папок

```powershell
# Находясь в папке frontend/
cd src

# Удали ненужные файлы
rm App.css

# Создай структуру папок
mkdir api, components, pages, hooks, store, types, utils, styles

# Создай подпапки в components
cd components
mkdir ui, chat, layout
cd ..

# Создай подпапки в dto (если нужно)
cd types
```

**Итоговая структура `src/`:**

```
src/
├── api/                    # API клиент
├── components/
│   ├── ui/                 # Базовые компоненты (Button, Input)
│   ├── chat/               # Компоненты чата
│   └── layout/             # Layout компоненты
├── pages/                  # Страницы приложения
├── hooks/                  # Кастомные хуки
├── store/                  # Zustand stores
├── types/                  # TypeScript типы
├── utils/                  # Утилиты
├── styles/                 # Дополнительные стили
├── App.tsx
├── main.tsx
└── index.css
```

---

## Шаг 6: Настройка переменных окружения

Создай файл `.env` в папке `frontend/`:

```powershell
notepad .env
```

**Содержимое `.env`:**

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

Создай `.env.example`:

```powershell
notepad .env.example
```

**Содержимое `.env.example`:**

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

---

## Шаг 7: Настройка axios клиента

Создай базовый API клиент:

```powershell
cd src/api
notepad axios.ts
```

**Содержимое `src/api/axios.ts`:**

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена (настроим в Фазе 2)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor для обработки ошибок
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Обработка неавторизованного доступа
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Шаг 8: Настройка React Router

Обновим `App.tsx`:

```powershell
cd ..
notepad App.tsx
```

**Содержимое `src/App.tsx`:**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<div>Login Page (TODO)</div>} />
        <Route path="/chat" element={<div>Chat Page (TODO)</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Временный HomePage для тестирования
function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          USMchat
        </h1>
        <p className="text-text-muted">
          Мессенджер для Молдавского государственного университета
        </p>
        <div className="mt-8 space-x-4">
          <a 
            href="/login" 
            className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90"
          >
            Войти
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## Шаг 9: Создание базовых типов

Создай файл типов:

```powershell
cd src/types
notepad user.types.ts
```

**Содержимое `src/types/user.types.ts`:**

```typescript
export interface User {
  id: number;
  idnp: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatarUrl?: string;
  createdAt: string;
  lastSeen?: string;
  isPasswordSet: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
```

---

## Шаг 10: Настройка ESLint (опционально)

Обновим `.eslintrc.cjs`:

```powershell
notepad .eslintrc.cjs
```

**Добавь правила:**

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
```

---

## Шаг 11: Обновление .gitignore

Проверь `.gitignore` в папке `frontend/`:

```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment
.env
.env.local
.env.production
```

---

## Шаг 12: Запуск Frontend приложения

```powershell
# Находясь в папке frontend/
npm run dev
```

**Что должно произойти:**
1. Vite запустится на порту 5173
2. Откроется браузер с `http://localhost:5173`
3. Увидишь стартовую страницу с заголовком "USMchat"

---

## Шаг 13: Проверка подключения к Backend

Создадим тестовую проверку API:

```powershell
cd src/api
notepad test.api.ts
```

**Содержимое `src/api/test.api.ts`:**

```typescript
import { axiosInstance } from './axios';

export const testApi = {
  health: async () => {
    const response = await axiosInstance.get('/health');
    return response.data;
  },

  ping: async () => {
    const response = await axiosInstance.get('/ping');
    return response.data;
  },
};
```

Обновим `App.tsx` для теста:

```typescript
import { useEffect, useState } from 'react';
import { testApi } from './api/test.api';

function HomePage() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    testApi.health()
      .then((data) => {
        setApiStatus('success');
        setApiMessage(data.message);
      })
      .catch(() => {
        setApiStatus('error');
        setApiMessage('Backend не отвечает');
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">USMchat</h1>
        
        {/* API Status */}
        <div className="mt-4">
          {apiStatus === 'loading' && <p>Проверка подключения...</p>}
          {apiStatus === 'success' && (
            <p className="text-green-600">✅ {apiMessage}</p>
          )}
          {apiStatus === 'error' && (
            <p className="text-accent-red">❌ {apiMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

Если Backend запущен, увидишь: **✅ USM Messenger API is running**

---

## ✅ Чеклист для Frontend разработчика

- [ ] Node.js 18+ установлена
- [ ] Vite проект создан с React + TypeScript
- [ ] Все зависимости установлены
- [ ] Tailwind CSS настроен (цвета из Figma)
- [ ] Структура папок создана
- [ ] `.env` файл создан
- [ ] axios клиент настроен
- [ ] React Router работает
- [ ] `.gitignore` настроен
- [ ] Приложение запускается (`npm run dev`)
- [ ] Подключение к Backend работает (health check)

---

# 🔄 Синхронизация работы

## Для обоих разработчиков

### 1. Инициализация Git репозитория

Если ещё не создан:

```powershell
cd "D:\Delevopment Workspace\Workflow\usm-messenger"
git init
git add .
git commit -m "init: project setup with backend and frontend"
```

### 2. Создание веток

```powershell
# Backend разработчик
git checkout -b backend/setup

# Frontend разработчик
git checkout -b frontend/setup
```

### 3. Workflow

1. Каждый работает в своей ветке
2. Регулярные коммиты (минимум раз в день)
3. Перед мержем в `main` — code review

---

# 📝 README для проекта

Создай файл `README.md` в корне:

```powershell
cd "D:\Delevopment Workspace\Workflow\usm-messenger"
notepad README.md
```

**Содержимое `README.md`:**

```markdown
# USMchat - Университетский мессенджер

Мессенджер для Молдавского государственного университета.

## Технологии

- **Backend**: Java 21, Spring Boot 3.2, PostgreSQL 16
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Real-time**: WebSocket (STOMP)
- **DevOps**: Docker, Docker Compose

## Быстрый старт

### Требования

- Java 21+
- Node.js 18+
- Docker Desktop

### Backend

```powershell
# Запуск PostgreSQL
docker-compose up -d postgres

# Запуск Spring Boot
cd backend
./mvnw.cmd spring-boot:run
```

API будет доступно на http://localhost:8080

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Приложение будет доступно на http://localhost:5173

## Структура проекта

- `/backend` - Spring Boot API
- `/frontend` - React приложение
- `/docs` - Документация

## Документация

- [План разработки](DEVELOPMENT_PLAN.md)
- [Фаза 1: Инициализация](PHASE_1_SETUP.md)

## Авторы

- Илья - Backend
- Мария - Frontend
```

---

# 🎉 Проверка завершения Фазы 1

Убедись, что всё работает:

### Backend:
```powershell
# 1. PostgreSQL запущен
docker ps | Select-String "usm-postgres"

# 2. Spring Boot запущен
curl http://localhost:8080/api/health

# 3. Таблицы созданы
docker exec -it usm-postgres psql -U usm -d usm_messenger -c "\dt"
```

### Frontend:
```powershell
# 1. Dev сервер запущен
# Открой http://localhost:5173

# 2. Tailwind работает (цвета отображаются)

# 3. Подключение к Backend работает (health check показывает ✅)
```

---

# 🚀 Что дальше?

После завершения Фазы 1 переходите к **Фазе 2: Аутентификация**

В Фазе 2 вы реализуете:
- Backend: User entity, JWT токены, AuthController
- Frontend: Страницы входа, установки пароля, AuthStore

---

**Фаза 1 завершена! 🎊**

Если возникли проблемы — проверь логи:
- Backend: в консоли где запущен `./mvnw.cmd spring-boot:run`
- Frontend: в консоли где запущен `npm run dev`
- PostgreSQL: `docker logs usm-postgres`
