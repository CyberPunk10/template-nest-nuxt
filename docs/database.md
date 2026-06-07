# База данных: PostgreSQL + Prisma

[← Главная](../README.md) · [Архитектура](architecture.md)

> **Ветка:** эта документация актуальна только для ветки `postgres-prisma`.

## Стек

- **PostgreSQL 17** — поднимается через Docker в dev-режиме
- **Prisma 7** — ORM, миграции, генерация клиента

---

## Локальный запуск

Поднять PostgreSQL через Docker:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Применить миграции и сгенерировать клиент:

```bash
cd apps/backend
pnpm prisma migrate dev
```

---

## Конфигурация

### `apps/backend/.env`

Параметры подключения к БД для Prisma и приложения:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
```

### Корневой `.env`

Параметры для Docker Compose:

```
POSTGRES_PORT=5432
```

### Изменение порта

Если порт 5432 занят — нужно поменять в **двух местах**:

1. `apps/backend/.env` — `POSTGRES_PORT=5435`
2. Корневой `.env` — `POSTGRES_PORT=5435`

Первый читает Prisma, второй читает Docker Compose при проксировании порта с хоста в контейнер.

---

## Prisma

### Структура

```
apps/backend/
├── prisma/
│   ├── schema.prisma       ← модели
│   └── migrations/         ← история миграций (коммитится в git)
└── prisma.config.ts        ← конфигурация Prisma (datasource URL)
```

### Основные команды

Все команды выполняются из `apps/backend/`:

```bash
cd apps/backend

# создать и применить миграцию
pnpm prisma migrate dev --name <название>

# применить миграции без создания новых (CI / production)
pnpm prisma migrate deploy

# открыть Prisma Studio (GUI для просмотра и редактирования данных)
pnpm prisma studio
# → http://localhost:5555

# перегенерировать клиент вручную
pnpm prisma generate
```

### Генерация клиента

Prisma генерирует клиент в `src/generated/prisma` — эта папка в `.gitignore`.
Клиент генерируется автоматически при `migrate dev`, но можно и вручную через `prisma generate`.

---

## Миграции

Папка `prisma/migrations/` коммитится в git — это история изменений схемы БД.
Никогда не редактируй файлы миграций вручную.

Для production используй `prisma migrate deploy` — он применяет только pending миграции без интерактивных вопросов.
