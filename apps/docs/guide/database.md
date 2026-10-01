# База данных: PostgreSQL + Prisma

> **Ветка:** эта документация актуальна только для ветки `postgres-prisma`.

## Стек

- **PostgreSQL 17** — поднимается через Docker
- **Prisma 7** — ORM, миграции, генерация клиента

---

## Локальный запуск

> **При переключении веток** локальный `.env` не обновляется автоматически — в нём могут отсутствовать переменные новой ветки. Сверь с `.env.example` и добавь недостающие.Например при смене ветки `main` → `postgres-prisma` в `apps/backend/.env` могут отсутствовать переменные `POSTGRES_*`. Скопируй их из `apps/backend/.env.example`.

Поднять PostgreSQL через Docker:

```bash
pnpm db:up
```

Отдельная команда нужна редко: `pnpm dev` поднимает БД сам. Остановить контейнер — `pnpm db:down` (данные остаются в volume).

БД описана в общем `docker-compose.yml` без профиля, а сервисы приложения — под профилем `app`. Поэтому `docker compose up` поднимает только postgres, а полный стек поднимается через `pnpm docker:up`.

Применить миграции:

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

Параметры контейнера БД — их читает Docker Compose:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
POSTGRES_PORT=5432
```

Логин, пароль и имя базы дублируются в двух файлах намеренно: корневой `.env` читает Compose, `apps/backend/.env` — Nest при локальном запуске вне Docker. В Docker-режиме backend получает эти значения из корневого `.env` (см. `environment` в `docker-compose.yml`), поэтому разойтись они могут только при `pnpm dev`.

### Если порт 5432 занят

Поменять нужно в двух файлах — на одно и то же значение:

```
.env                  POSTGRES_PORT=5435
apps/backend/.env     POSTGRES_PORT=5435
```

Корневой `.env` задаёт порт, на котором контейнер БД публикуется на хост-машине. Второй нужен, когда backend поднят через `pnpm dev`: по нему Nest и Prisma узнают, на какой порт подключаться к базе.

Когда backend сам работает в контейнере, второй файл не используется вовсе: compose подставляет ему `postgres:5432`, то есть имя сервиса и порт внутри сети.

---

## Prisma

### Структура

```
apps/backend/
├── prisma/
│   ├── schema.prisma       ← модели
│   ├── migrations/         ← история миграций (коммитится в git)
│   └── seed.ts             ← создание admin-аккаунта
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

Клиент — артефакт сборки: Prisma строит его из `schema.prisma` в `src/generated/prisma`, в репозитории его нет.

Обычно запускать генерацию вручную не нужно: её делает `postinstall` в `apps/backend/package.json` во время `pnpm install`. Так клиент появляется на свежем клоне, в CI и в Docker-образе.

Вручную — когда схема изменилась: после её правки или после `git pull`. Сам клиент в этом случае не обновится: `migrate dev` в Prisma 7 его не генерирует, а `pnpm install` без новых зависимостей пропускает `postinstall`.

```bash
pnpm db:generate
```

Генератор настроен на CommonJS:

```prisma
generator client {
  provider            = "prisma-client"
  output              = "../src/generated/prisma"
  moduleFormat        = "cjs"
  importFileExtension = ""
}
```

Обе настройки подобраны под то, как код исполняется в этом шаблоне.

`moduleFormat = "cjs"` — потому что Nest компилирует в CommonJS, а генератор по умолчанию выдаёт ESM. Без этого в собранный клиент попадает `import.meta`, из-за которого Node считает файл ESM-модулем и падает на `exports`:

```
ReferenceError: exports is not defined in ES module scope
```

Проявляется только в собранном образе. При `pnpm dev` Nest пересобирает код на лету и запускает его из `dist/` в том же процессе, поэтому несоответствие не всплывает.

`importFileExtension = ""` — потому что генератор создаёт только `.ts`-файлы, а по умолчанию ссылается на них как на `.js`. TypeScript такие импорты понимает, но Jest — нет:

```
Cannot find module './internal/class.js' from 'generated/prisma/client.ts'
```

Пустое значение убирает расширение из импортов, и клиент резолвится и сборкой, и тестами.

### Seed: admin-аккаунт

Обычная регистрация (`POST /auth/register`) всегда создаёт пользователя с ролью `user` (гарантия схемы — `role Role @default(user)`), поэтому без отдельного шага в БД не появится ни одного `admin`. Для этого есть `prisma/seed.ts` — запускается отдельной командой, в том числе сразу после `migrate reset`:

```bash
cd apps/backend
pnpm prisma migrate reset   # пересоздать БД (если нужно)
pnpm prisma db seed         # затем явно создать admin-аккаунт
```

Скрипт идемпотентен (upsert по email) и берёт данные из `ADMIN_EMAIL`/`ADMIN_PASSWORD` в `.env`.

Подробности (как это работает, продакшен-примечания) — в [Auth → Backend: Seed](./auth/backend.md#seed-создание-admin-аккаунта).

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

---

## Коды ошибок Prisma

Prisma нормализует ошибки PostgreSQL в собственные коды через `PrismaClientKnownRequestError`. Это позволяет обрабатывать ошибки без парсинга текстовых сообщений драйвера.

Наиболее часто встречающиеся коды:

| Код     | Смысл                                                         | Типичная реакция                     |
| ------- | ------------------------------------------------------------- | ------------------------------------ |
| `P2002` | Нарушение unique constraint (например, email уже занят)       | `409 Conflict`                       |
| `P2025` | Запись не найдена при `update`, `delete`, `findUniqueOrThrow` | `404 Not Found`                      |
| `P2003` | Нарушение foreign key constraint                              | `409 Conflict` или `400 Bad Request` |

Идиоматичный паттерн — сразу делать `update`/`delete` и ловить P2025, вместо предварительного `findUniqueOrThrow`.

::: tip TOCTOU (Time-Of-Check Time-Of-Use)
Класс багов, при которых между проверкой условия и его использованием есть окно, в котором состояние может измениться. Здесь: между `findUniqueOrThrow` (проверка) и `update`/`delete` (использование) другой процесс успевает удалить запись.
:::

❌ **Два запроса с TOCTOU-окном:**

```typescript
// Запрос 1: проверяем существование
await this.prisma.user.findUniqueOrThrow({ where: { id } }).catch(() => {
  throw new NotFoundException() // обработано
})
// ← здесь другой процесс может удалить запись
// Запрос 2: обновляем — бросает необработанный P2025 → 500
return await this.prisma.user.update({ where: { id }, data: dto })
```

✅ **Один запрос, P2025 обработан явно:**

```typescript
try {
  return await this.prisma.user.update({ where: { id }, data: dto })
} catch (e) {
  if (e instanceof PrismaClientKnownRequestError) {
    if (e.code === 'P2025') throw new NotFoundException()
    if (e.code === 'P2002') throw new ConflictException()
  }
  throw e
}
```

Это исключает TOCTOU-окно между двумя запросами и сокращает число обращений к БД вдвое.

Полный список кодов: [Prisma Error Reference](https://www.prisma.io/docs/orm/reference/error-reference)
