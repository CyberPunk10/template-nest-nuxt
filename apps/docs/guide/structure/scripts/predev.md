# predev.mjs

Запускается автоматически перед `pnpm dev` — через npm `pre*`-конвенцию.

Делает три вещи:

1. **Копирует `.env.example` → `.env`** для всех четырёх файлов разом (корневой, `apps/backend`, `apps/frontend`, `apps/docs`) — через общую `copyEnvFiles()` из [`copy-env.mjs`](/guide/structure/scripts/copy-env).
2. **Проверяет порты и разрешает конфликты** — через общую `checkPorts()` из [`check-ports.mjs`](/guide/structure/scripts/check-ports). При конфликте предлагает диалог: убить занявший процесс или прервать запуск.
3. **Поднимает БД** — через `dbUp()` из [`db.mjs`](/guide/structure/scripts/db). Приложения при `pnpm dev` работают локально, но Postgres нужен из Docker. Повторный вызов на уже поднятом контейнере ничего не меняет.

Проверяются dev-порты: `PORT` из `apps/backend/.env`, `apps/frontend/.env` и `apps/docs/.env`.

Порт БД в список не входит: проверка умеет только убивать процессы на хосте, а этот порт держит Docker. Его занятость поймает шаг 3 — Docker скажет `address already in use`.

Тем же занимается [`predocker.mjs`](/guide/structure/scripts/predocker) — разница в списке портов и в том, что БД он не поднимает отдельно: её поднимает сам `docker compose` вместе с остальными сервисами.

## Что выводит

Каждый шаг пишет строку о результате:

```
[predev.mjs] ✓ .env: created apps/backend/.env from .env.example
[predev.mjs] ✓ ports: backend 3100 · frontend 3200 · docs 5173
[predev.mjs] ✓ db: postgres is up
```

Если шаг не выполнен — строка с ✗ и имя шага, дальше подготовка не идёт:

```
[predev.mjs] ✗ ports: PORT=abc in apps/backend/.env - not a valid port number (0-65535)
```

| Шаг     | Что проверить                                                | Повторить отдельно |
| ------- | ------------------------------------------------------------ | ------------------ |
| `.env`  | есть ли `.env.example` рядом с нужным `.env`                 | `pnpm env:copy`    |
| `ports` | значение `PORT` в указанном `.env`                           | `pnpm predev`      |
| `db`    | запущен ли Docker и заданы ли `POSTGRES_*` в корневом `.env` | `pnpm db:up`       |

## Использование

Запускается сам — отдельно вызывать не нужно:

```bash
pnpm dev
```

npm видит скрипт `predev` и выполняет его перед `dev`. Запустить только подготовку, без старта приложений:

```bash
pnpm predev
```
