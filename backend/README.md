# USM Messenger — Backend

## Запуск PostgreSQL (обязательно перед запуском приложения и тестов)

Приложение подключается к БД на `localhost:5432` с учёными данными: **user=usm, password=usm123, database=usm_messenger**.

Типичные ошибки:

| Ошибка | Причина |
|--------|--------|
| **Connection refused** | На 5432 ничего не слушает — Postgres не запущен |
| **password authentication failed for user "usm"** | На 5432 крутится другой контейнер (например usm2-postgres) с другими user/password. Нужен именно контейнер из этого проекта. |

### Вариант 1: Docker (рекомендуется)

Используй контейнер **из этого репозитория** — в нём уже настроены user `usm`, password `usm123`, БД `usm_messenger`.

1. Останови любой другой Postgres на 5432 (например **usm2-postgres**), иначе порт занят.
2. Из **корня проекта** (не из `backend/`):

```powershell
cd D:\Delevopment Workspace\Workflow\usm-messenger
docker-compose up -d postgres
```

3. Проверка:

```powershell
docker ps
# Должен быть контейнер именно usm-postgres (не usm2-postgres), порт 5432
```

### Вариант 2: Локальная установка PostgreSQL

Установи PostgreSQL 16, создай БД `usm_messenger`, пользователя `usm` с паролем `usm123` и убедись, что сервер слушает порт 5432.

---

## Сборка и запуск

```powershell
# Сборка (тесты требуют запущенный PostgreSQL)
.\build.ps1 clean install

# Или без тестов, если Postgres не запущен
.\build.ps1 clean install -DskipTests

# Запуск приложения (PostgreSQL должен быть запущен)
.\build.ps1 spring-boot:run
```

Через mvnw (если JAVA_HOME указывает на Java 21):

```powershell
./mvnw.cmd clean install
./mvnw.cmd spring-boot:run
```

---

## Порядок действий при ошибке «Connection refused»

1. Запусти PostgreSQL: из корня проекта `docker-compose up -d postgres`.
2. Дождись готовности (несколько секунд), затем снова запусти приложение или тесты.
