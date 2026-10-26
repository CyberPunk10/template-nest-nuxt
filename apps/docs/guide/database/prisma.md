# Prisma: схема и клиент

## Структура

```
apps/backend/
├── prisma/
│   ├── schema.prisma       ← модели
│   ├── migrations/         ← история миграций (коммитится в git)
│   └── seed.ts             ← создание admin-аккаунта
└── prisma.config.ts        ← конфигурация Prisma (datasource URL)
```

Как менять схему и работать с `migrations/` — на странице [Миграции](./migrations).

## Генерация клиента

Клиент — артефакт сборки: Prisma строит его из `schema.prisma` в `src/generated/prisma`, в репозитории его нет.

Обычно запускать генерацию вручную не нужно: её делает `postinstall` в `apps/backend/package.json` во время `pnpm install`. Так клиент появляется на свежем клоне и в Docker-образе.

Вручную — когда схема изменилась: после её правки или после `git pull`. Сам клиент в этом случае не обновится: `migrate dev` меняет только БД и клиент не генерирует, а `pnpm install` без новых зависимостей пропускает `postinstall`.

```bash
pnpm db:generate
```

## Настройки генератора

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

## Seed: admin-аккаунт

Обычная регистрация (`POST /auth/register`) всегда создаёт пользователя с ролью `user` (гарантия схемы — `role Role @default(user)`), поэтому без отдельного шага в БД не появится ни одного `admin`. Для этого есть `prisma/seed.ts` — запускается отдельной командой, в том числе сразу после `migrate reset`:

```bash
cd apps/backend
pnpm prisma migrate reset   # пересоздать БД (если нужно)
pnpm prisma db seed         # необязательно: сид выполнит и следующий pnpm dev
```

`pnpm dev` запускает сид сам — шагом подготовки перед стартом, поэтому вручную он нужен, только если админ нужен сразу. Скрипт идемпотентен: если пользователь с этим email уже есть, он ничего не делает и пароль не трогает. Данные берёт из `ADMIN_EMAIL`/`ADMIN_PASSWORD` в `.env`.

Подробности (как это работает, продакшен-примечания) — в [Auth → Backend: Seed](../auth/backend#seed-создание-admin-аккаунта).
