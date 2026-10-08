# package.json

Корневой манифест монорепо. Его скрипты оркеструют весь репозиторий: `pnpm -r ...` по всем воркспейсам.

| Скрипт           | Команда                                 | Что делает                                                                                 |
| ---------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `env:copy`       | `node scripts/copy-env-cli.mjs`         | Создаёт все `.env` из `.env.example`, которых ещё нет — ничего не запускает и не проверяет |
| `env:copy:force` | `node scripts/copy-env-cli.mjs --force` | То же, но перезаписывает существующие `.env` — локальные правки теряются                   |
| `predev`         | `node scripts/predev.mjs`               | Запускается автоматически перед `dev` (npm `pre*`-конвенция)                               |
| `dev`            | `node scripts/dev.mjs`                  | Параллельно поднимает backend, frontend и docs (через `concurrently`)                      |
| `db:up`          | `node scripts/db.mjs up`                | Поднимает контейнер БД и ждёт healthcheck                                                  |
| `db:down`        | `node scripts/db.mjs down`              | Останавливает контейнер БД, данные остаются в volume                                       |
| `db:generate`    | `node scripts/db.mjs generate`          | Генерирует клиент Prisma — нужен после правки схемы; после `pnpm install` запускается сам  |
| `db:migrate`     | `node scripts/db.mjs migrate`           | Применяет миграции, которых ещё нет в БД                                                   |
| `db:seed`        | `node scripts/db.mjs seed`              | Создаёт админа из `ADMIN_EMAIL` и `ADMIN_PASSWORD`, если его ещё нет                       |
| `predocker:up`   | `node scripts/predocker.mjs`            | Запускается автоматически перед `docker:up`                                                |
| `docker:up`      | `docker compose --profile app up`       | Поднимает весь стек в Docker: БД, backend, frontend, nginx                                 |
| `build`          | `pnpm -r build`                         | Собирает все workspace-пакеты (запускает `build` в каждом `apps/*`)                        |
| `test`           | `pnpm -r test`                          | Юнит-тесты по всем воркспейсам (пакеты без `test` пропускаются)                            |
| `test:e2e`       | `pnpm -r test:e2e`                      | E2E-тесты — поднимают приложение целиком, поэтому вынесены из `test`                       |
| `lint`           | `pnpm -r lint`                          | Линтер по всем workspace-пакетам                                                           |
| `type-check`     | `pnpm -r type-check`                    | Проверка типов по всем workspace-пакетам                                                   |
| `reinstall`      | `node scripts/reinstall.mjs`            | Удаляет `node_modules`/`pnpm-lock.yaml` и переустанавливает зависимости с нуля             |
| `deps:sync`      | `pnpm update -r`                        | Подтягивает диапазоны в `package.json` к реально установленным версиям                     |
| `prepare`        | `husky`                                 | Настраивает git-хуки (вызывается автоматически при `pnpm install`)                         |

Скрипты не пересекаются со скриптами приложений: корневые работают со всем монорепо, per-app — только внутри своего воркспейса и вызываются через фильтр (`pnpm --filter backend dev`) или транзитивно из корневых.

За большинством команд стоят [Node-скрипты](./scripts/) из `scripts/`.

## Зависимости

Все пакеты корня — `devDependencies`: они нужны только при разработке и в образы не попадают.

| Пакет | Зачем |
| --- | --- |
| `concurrently` | Параллельный запуск трёх приложений в `pnpm dev` ([dev.mjs](./scripts/dev)) |
| `@clack/prompts` | Диалог при конфликте портов ([check-ports.mjs](./scripts/check-ports)) |
| `eslint`, `@eslint/js` | Линтер и его базовые правила для JavaScript |
| `typescript-eslint` | Правила и парсер ESLint для TypeScript |
| `@stylistic/eslint-plugin` | Правила форматирования кода вместо Prettier |
| `globals` | Списки глобальных переменных Node и браузера для ESLint |
| `typescript` | Компилятор, без которого не работает `typescript-eslint` |
| `husky` | Git-хуки: подключаются скриптом `prepare` |
| `lint-staged` | Линтер только по застейдженным файлам в pre-commit хуке |
| `@commitlint/cli`, `@commitlint/config-conventional` | Проверка сообщений коммитов по Conventional Commits |

## Версии инструментов

```json
"packageManager": "pnpm@11.27.1",
"engines": {
  "node": ">=24",
  "pnpm": ">=11",
  "npm": "please-use-pnpm"
}
```

`packageManager` фиксирует версию pnpm через Corepack, `engines` вместе с `engine-strict=true` в `.npmrc` не даёт поставить зависимости на неподходящей версии Node — [pnpm и Corepack](../pnpm).
