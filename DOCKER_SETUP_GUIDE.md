# Пошаговая инструкция: Docker для backend, frontend и docker-compose

Документ для разработчиков: как написать Dockerfile для бэкенда, для фронтенда и как настроить общий `docker-compose.yml`. Все шаги расписаны простыми словами с пояснениями.

---

## Содержание

1. [Backend: как написать Dockerfile](#1-backend-как-написать-dockerfile)
2. [Frontend: как написать Dockerfile](#2-frontend-как-написать-dockerfile)
3. [Общий docker-compose.yml](#3-общий-docker-composeyml)
4. [Запуск и проверка](#4-запуск-и-проверка)

---

## 1. Backend: как написать Dockerfile

**Кто:** бэкенд-разработчик.  
**Где:** файл `Dockerfile` в папке `backend/` (рядом с `pom.xml`).  
**Зачем:** чтобы собирать Java-приложение (Spring Boot) в образ и запускать его в контейнере без установки Maven и JDK на машине.

### Что такое многостадийная сборка

Мы используем **две стадии** в одном Dockerfile:

- **Стадия 1 (build):** образ с Maven и JDK — только для сборки. Здесь мы вызываем `mvn package` и получаем JAR-файл.
- **Стадия 2 (runtime):** образ только с JRE (без Maven и исходников). Сюда копируем готовый JAR и запускаем его. Итоговый образ получается меньше и безопаснее.

### Шаг 1.1. Создать файл

В корне папки `backend/` создай файл с именем `Dockerfile` (без расширения).

### Шаг 1.2. Стадия сборки (build)

В начале файла пишем:

```dockerfile
# Стадия 1: сборка JAR
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
```

**Что это значит:**

- `FROM eclipse-temurin:21-jdk-alpine` — базовый образ с Java 21 (JDK). Alpine — лёгкий вариант, образ будет меньше.
- `AS build` — даём стадии имя `build`, чтобы потом сослаться на неё.
- `WORKDIR /app` — рабочая директория внутри контейнера. Все следующие команды выполняются в `/app`.

Дальше копируем только файлы, нужные Maven для сборки (так кэш Docker будет использоваться эффективнее):

```dockerfile
# Сначала копируем только pom.xml
COPY pom.xml .
# Скачиваем зависимости (этот слой закэшируется, если pom не менялся)
RUN mvn dependency:go-offline -B
# Копируем исходный код
COPY src ./src
```

**Пояснение:**

- Сначала копируем `pom.xml` и один раз вызываем `mvn dependency:go-offline`. Пока `pom.xml` не меняется, Docker переиспользует этот слой и не качает зависимости заново.
- Потом копируем `src/`. При изменении только кода пересобирается только последняя часть.

Собираем приложение без запуска тестов (тесты в контейнере можно включить позже, при необходимости):

```dockerfile
RUN mvn package -B -DskipTests
```

**Пояснение:**

- `-B` — batch-режим, без интерактива.
- `-DskipTests` — тесты не запускаются. Так сборка быстрее и не требует, например, поднятой БД на этапе `docker build`. Если захочешь тесты в образе — уберёшь флаг и настроишь подключение к БД при сборке (сложнее).

Имя JAR-файла у Spring Boot по умолчанию: `{artifactId}-{version}.jar`. В твоём `pom.xml`: `messenger` и `0.0.1-SNAPSHOT`, значит файл будет `messenger-0.0.1-SNAPSHOT.jar` в `target/`. Если позже изменишь версию в `pom.xml`, поправь имя в Dockerfile.

### Шаг 1.3. Стадия запуска (runtime)

Пишем вторую стадию:

```dockerfile
# Стадия 2: только JRE и JAR
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Копируем JAR из стадии build
COPY --from=build /app/target/messenger-0.0.1-SNAPSHOT.jar app.jar
# Порт, на котором слушает приложение (как в application.yml: 8080)
EXPOSE 8080
# Запуск приложения
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Пояснение:**

- `FROM eclipse-temurin:21-jre-alpine` — образ только с JRE, без компилятора и Maven.
- `COPY --from=build ...` — копируем файл из стадии с именем `build`, не с хоста.
- `EXPOSE 8080` — документируем, что контейнер слушает порт 8080. Реальное пробрасывание порта делается в `docker-compose` или `docker run`.
- `ENTRYPOINT` — команда запуска при старте контейнера.

### Шаг 1.4. Итоговый backend/Dockerfile

В итоге файл `backend/Dockerfile` должен выглядеть так:

```dockerfile
# Стадия 1: сборка JAR
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -B -DskipTests

# Стадия 2: только JRE и JAR
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/messenger-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Важно:** если в `pom.xml` поменяешь `artifactId` или `version`, измени строку `COPY --from=build ...` под новое имя JAR (или вынеси его в `ARG` и задавай из `pom.xml`/compose).

Подключение к базе данных в Docker задаётся **не в Dockerfile**, а через переменные окружения в `docker-compose.yml` (хост БД будет именем сервиса `postgres`). Это описано в разделе про docker-compose.

---

## 2. Frontend: как написать Dockerfile

**Кто:** фронтенд-разработчик.  
**Где:** файл `Dockerfile` в папке `frontend/` (рядом с `package.json`).  
**Зачем:** собрать статику (HTML, JS, CSS) и отдавать её через nginx в контейнере. Так обычно делают для продакшена.

Здесь тоже **две стадии**:

- **Стадия 1 (build):** Node.js — устанавливаем зависимости, вызываем `npm run build`. На выходе папка `dist/`.
- **Стадия 2 (serve):** nginx — только копируем `dist/` и настраиваем раздачу статики.

### Шаг 2.1. Создать файл

В корне папки `frontend/` создай файл `Dockerfile`.

### Шаг 2.2. Стадия сборки

В начале Dockerfile:

```dockerfile
# Стадия 1: сборка статики
FROM node:22-alpine AS build
WORKDIR /app
```

**Пояснение:**

- `node:22-alpine` — образ с Node.js 22 (подойдёт для текущего Vite/React). Alpine — меньший размер.
- `WORKDIR /app` — все команды дальше выполняются в `/app`.

Копируем зависимости и исходники:

```dockerfile
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
```

**Пояснение:**

- Сначала копируем только `package.json` и (если есть) `package-lock.json`, затем `npm ci`. Пока зависимости не меняются, слой с `npm ci` кэшируется.
- `COPY . .` — копируем весь проект (в т.ч. `src/`, `index.html`, `vite.config.ts` и т.д.).

Переменная `VITE_API_URL` в Vite подставляется **на этапе сборки**. Для продакшена нужно указать URL, по которому браузер пользователя будет обращаться к API (например, тот же хост или отдельный домен). В примере задаём значение по умолчанию для локального запуска:

```dockerfile
ARG VITE_API_URL=http://localhost:8080/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

**Пояснение:**

- `ARG` — аргумент сборки. Его можно переопределить при `docker build` или из `docker-compose` (build args).
- `ENV` — переменная окружения при сборке. Vite читает `import.meta.env.VITE_API_URL` именно из таких переменных.
- После `npm run build` в папке `dist/` будет готовая статика.

### Шаг 2.3. Стадия с nginx

Вторая стадия — только раздача готовых файлов:

```dockerfile
# Стадия 2: раздача статики через nginx
FROM nginx:alpine
# Удаляем дефолтную конфигурацию nginx
RUN rm /etc/nginx/conf.d/default.conf
# Копируем нашу конфигурацию (создадим ниже)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Копируем собранную статику из стадии build
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Пояснение:**

- `nginx:alpine` — лёгкий образ с nginx.
- Своя `nginx.conf` нужна, чтобы для SPA (React Router) все запросы к путям типа `/chat`, `/login` отдавали `index.html`, а не 404. Файл `nginx.conf` создаём в папке `frontend/` рядом с Dockerfile.
- `COPY --from=build /app/dist` — копируем только результат сборки из первой стадии.
- `EXPOSE 80` — nginx слушает порт 80.
- `CMD` — запуск nginx в foreground, чтобы контейнер не завершался.

### Шаг 2.4. Конфигурация nginx для SPA

В папке `frontend/` создай файл `nginx.conf` со следующим содержимым:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Пояснение:**

- `try_files $uri $uri/ /index.html` — если файл или папка не найдены, отдаём `index.html`. Так React Router обрабатывает пути вроде `/chat`, `/login` на клиенте.
- Блок `location /api` — опционален, если фронт ходит на бэкенд по относительному пути `/api`. Тогда nginx в контейнере проксирует запросы на сервис `backend:8080`. Если фронт обращается напрямую по `VITE_API_URL` (например, `http://localhost:8080/api`), этот блок можно не использовать или убрать — тогда CORS должен быть настроен на бэкенде.

Если решишь не проксировать `/api` через nginx, оставь в `nginx.conf` только:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Шаг 2.5. Итоговый frontend/Dockerfile

Полный `frontend/Dockerfile`:

```dockerfile
# Стадия 1: сборка статики
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

ARG VITE_API_URL=http://localhost:8080/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Стадия 2: раздача статики через nginx
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Если в проекте нет `package-lock.json`, команда `npm ci` не сработает. Тогда замени на:

```dockerfile
COPY package.json ./
RUN npm install
COPY . .
```

И добавь в `.dockerignore` строки `node_modules` и `dist`, чтобы они не копировались с хоста и не перезаписывали результат сборки.

### Шаг 2.6. Файл .dockerignore (рекомендуется)

В папке `frontend/` создай файл `.dockerignore`:

```
node_modules
dist
.git
.env
.env.*
*.md
```

Так в контекст сборки не попадут лишние файлы, образ будет собираться быстрее и без конфликтов с `node_modules` и `dist`.

---

## 3. Общий docker-compose.yml

**Кто:** любой разработчик или DevOps.  
**Где:** корень проекта (рядом с папками `backend/` и `frontend/`).  
**Зачем:** одной командой поднять базу, бэкенд и фронт, связать их одной сетью и зависимостями.

### Что такое сервис и сеть

- **Сервис** — это один контейнер (или группа контейнеров), описанная под своим именем (например, `postgres`, `backend`, `frontend`).
- По умолчанию Compose создаёт одну **внутреннюю сеть**. Контейнеры обращаются друг к другу по **имени сервиса** как по имени хоста. Например, бэкенд подключается к БД по адресу `postgres:5432`, а не `localhost:5432`.
- **Порты** в формате `"HOST:CONTAINER"` — только те, что указаны в `ports`, доступны с твоего компьютера. Остальное — только внутри сети контейнеров.

### Шаг 3.1. Структура файла

В корне проекта открой (или создай) `docker-compose.yml`. Структура:

```yaml
version: '3.8'

services:
  postgres:   # уже есть
    ...
  backend:    # добавляем
    ...
  frontend:   # добавляем
    ...

volumes:
  postgres_data:
    ...
```

Секция `postgres` у тебя уже есть — её можно не трогать. Ниже добавляются сервисы `backend` и `frontend`.

### Шаг 3.2. Сервис backend

Добавь новый блок `backend` в `services:` (с отступами как у `postgres`):

```yaml
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: usm-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/usm_messenger
      SPRING_DATASOURCE_USERNAME: usm
      SPRING_DATASOURCE_PASSWORD: usm123
    depends_on:
      postgres:
        condition: service_healthy
```

**Пояснение по полям:**

- **build** — образ собирается из `backend/Dockerfile`, контекст сборки — папка `./backend` (относительно папки с `docker-compose.yml`).
- **container_name** — имя контейнера в `docker ps`. Удобно для логов и отладки.
- **restart: unless-stopped** — контейнер перезапускается после падения, пока ты его не остановил вручную.
- **ports: "8080:8080"** — порт 8080 на твоей машине пробрасывается на порт 8080 в контейнере. Приложение доступно по `http://localhost:8080`.
- **environment** — переменные окружения для Spring Boot. Они переопределяют настройки из `application.yml`. Важно: хост БД — `postgres` (имя сервиса), порт — 5432 (внутренний порт контейнера postgres).
- **depends_on + condition: service_healthy** — backend стартует только после того, как postgres поднимется и пройдёт healthcheck. Так не будет ошибок подключения к БД при старте.

### Шаг 3.3. Сервис frontend

Добавь блок `frontend`:

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:8080/api
    container_name: usm-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
```

**Пояснение:**

- **build** — образ из `frontend/Dockerfile`, контекст — `./frontend`.
- **args** — аргументы сборки. `VITE_API_URL` передаётся в Dockerfile как `ARG` и подставляется в фронт при `npm run build`. `http://localhost:8080/api` — с точки зрения браузера пользователя API доступен по этому адресу (порт 8080 проброшен с backend).
- **ports: "3000:80"** — порт 80 внутри контейнера (nginx) пробрасываем на порт 3000 на твоей машине. Приложение открывается по `http://localhost:3000`.
- **depends_on: backend** — фронт стартует после backend (чтобы к моменту открытия страницы API уже был доступен). У frontend нет `condition: service_healthy`, потому что у backend в этом примере нет healthcheck — при желании его можно добавить.

Если захочешь передать другой URL API при сборке (например, для продакшена), измени `VITE_API_URL` в `args`.

### Шаг 3.4. Полный пример docker-compose.yml

Итоговый файл в корне проекта может выглядеть так:

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

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: usm-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/usm_messenger
      SPRING_DATASOURCE_USERNAME: usm
      SPRING_DATASOURCE_PASSWORD: usm123
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:8080/api
    container_name: usm-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
    driver: local
```

Все три сервиса оказываются в одной сети и видят друг друга по именам: `postgres`, `backend`, `frontend`.

---

## 4. Запуск и проверка

### Сборка и запуск

Из **корня проекта** (где лежит `docker-compose.yml`):

```powershell
docker-compose up --build -d
```

**Пояснение:**

- `up` — поднять все сервисы.
- `--build` — перед запуском пересобрать образы (нужно при первом запуске и после изменений в Dockerfile или коде).
- `-d` — в фоне (detached). Без `-d` логи пойдут в консоль.

Порядок старта: сначала postgres, после его healthcheck — backend, затем frontend.

### Проверка

- **База:** подключение с хоста на `localhost:5432`, пользователь `usm`, пароль `usm123`, БД `usm_messenger`.
- **Backend API:** в браузере или через curl: `http://localhost:8080` (и твои эндпоинты, например `/api/...`).
- **Frontend:** в браузере: `http://localhost:3000`.

### Полезные команды

- Остановить все сервисы:
  ```powershell
  docker-compose down
  ```
- Посмотреть логи (все сервисы или один):
  ```powershell
  docker-compose logs -f
  docker-compose logs -f backend
  ```
- Пересобрать только backend после изменений:
  ```powershell
  docker-compose up --build -d backend
  ```

---

## Краткая сводка

| Кто        | Файлы | Действие |
|-----------|--------|----------|
| Backend   | `backend/Dockerfile` | Многостадийная сборка: Maven → JAR, затем JRE + `java -jar`. Подключение к БД задаётся в compose через `SPRING_DATASOURCE_*`. |
| Frontend  | `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/.dockerignore` | Сборка статики через Node, раздача через nginx. `VITE_API_URL` задаётся при сборке (build args в compose). |
| Общее     | `docker-compose.yml` в корне | Сервисы `postgres`, `backend`, `frontend`; порты 5432, 8080, 3000; переменные окружения и `depends_on`. |

После выполнения этих шагов один раз команда `docker-compose up --build -d` из корня проекта поднимает базу, бэкенд и фронт и связывает их между собой.
