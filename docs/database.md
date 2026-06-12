# База данных: PostgreSQL + Prisma

[← Главная](../README.md)

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

---

## Устранение расхождений между схемой и сгенерированным клиентом

### Как возникает проблема

Prisma работает с двумя независимыми артефактами:

1. **История миграций** — файлы в `prisma/migrations/`, коммитятся в git.
2. **Сгенерированный клиент** — TypeScript-код в `src/generated/prisma/`, не коммитится (в `.gitignore`).

Клиент генерируется из реального состояния БД в момент `prisma migrate dev`. Если в БД была применена миграция, файл которой отсутствует в `migrations/` — например, создана на другой машине или в другой ветке и не попала в git — то клиент будет содержать поля и модели, которых нет в `schema.prisma`. Результат: TypeScript-ошибки на поля, которых нет в коде.

Признак этой ситуации в выводе `migrate dev`:

```
Drift detected: Your database schema is not in sync with your migration history.
The following migration(s) are applied to the database but missing from the local migrations directory: 20260607165435_add_auth
```

### Решение для dev-среды

Нужно сбросить БД до состояния, описанного актуальными файлами миграций, и пересобрать клиент:

```bash
cd apps/backend

# 1. Сбросить БД и применить миграции заново (все данные будут удалены)
pnpm prisma migrate reset

# 2. Перегенерировать клиент из актуальной schema.prisma
pnpm prisma generate
```

> `migrate reset` не запускает `generate` автоматически — клиент нужно пересобрать отдельно.
> После этого TypeScript-ошибки на «несуществующие» поля исчезнут.

### Когда этот способ не подходит

Если расхождение возникло в **production** или в среде с данными, которые нельзя потерять, — `migrate reset` неприемлем. В таком случае нужно либо восстановить потерянный файл миграции из git-истории другой ветки или машины, либо использовать `prisma migrate resolve` для ручного согласования состояния.
