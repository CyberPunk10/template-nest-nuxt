# Конфигурация

Параметры БД задаются в двух `.env`: корневой читает Docker Compose, `apps/backend/.env` — Nest и Prisma при локальном запуске.

## `apps/backend/.env`

Параметры подключения к БД для Prisma и приложения:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
```

## Корневой `.env`

Параметры контейнера БД — их читает Docker Compose:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
POSTGRES_PORT=5432
```

Логин, пароль и имя базы дублируются в двух файлах намеренно: корневой `.env` читает Compose, `apps/backend/.env` — Nest при локальном запуске вне Docker. В Docker-режиме backend получает эти значения из корневого `.env` (см. `environment` в `docker-compose.yml`), поэтому разойтись они могут только при `pnpm dev`.

## Если порт 5432 занят

Поменять нужно в двух файлах — на одно и то же значение:

```
.env                  POSTGRES_PORT=5435
apps/backend/.env     POSTGRES_PORT=5435
```

Корневой `.env` задаёт порт, на котором контейнер БД публикуется на хост-машине. Второй нужен, когда backend поднят через `pnpm dev`: по нему Nest и Prisma узнают, на какой порт подключаться к базе.

Когда backend сам работает в контейнере, второй файл не используется вовсе: compose подставляет ему `postgres:5432`, то есть имя сервиса и порт внутри сети.

## При переключении веток

Локальный `.env` не обновляется автоматически — в нём могут отсутствовать переменные новой ветки. Сверьте его с `.env.example` и добавьте недостающие. Например, при переходе с `main` на `postgres-prisma` в `apps/backend/.env` может не быть переменных `POSTGRES_*` — скопируйте их из `apps/backend/.env.example`.
