# predev.mjs

Запускается автоматически перед `pnpm dev` — через npm `pre*`-конвенцию.

Перед запуском выполняет по порядку:

1. **Копирует `.env.example` → `.env`** для всех четырёх файлов разом (корневой, `apps/backend`, `apps/frontend`, `apps/docs`) — через общую `copyEnvFiles()` из [`copy-env.mjs`](./copy-env).
2. **Проверяет порты и разрешает конфликты** — через общую `checkPorts()` из [`check-ports.mjs`](./check-ports). При конфликте предлагает диалог: убить занявший процесс или прервать запуск.

Проверяются dev-порты: `PORT` из `apps/backend/.env`, `apps/frontend/.env` и `apps/docs/.env`.

Тем же занимается [`predocker.mjs`](./predocker) — разница только в списке портов и в том, что он дополнительно заводит Docker-сеть.

## Что выводит

Каждый шаг пишет строку о результате:

```
[predev.mjs] ✓ .env: created apps/backend/.env from .env.example
[predev.mjs] ✓ ports: backend 3100 · frontend 3200 · docs 5173
```

Если шаг не выполнен — строка с ✗ и имя шага, дальше подготовка не идёт:

```
[predev.mjs] ✗ ports: PORT=abc in apps/backend/.env - not a valid port number (0-65535)
```

| Шаг     | Что проверить                                | Повторить отдельно |
| ------- | -------------------------------------------- | ------------------ |
| `.env`  | есть ли `.env.example` рядом с нужным `.env` | `pnpm env:copy`    |
| `ports` | значение `PORT` в указанном `.env`           | `pnpm predev`      |

## Использование

Запускается сам — отдельно вызывать не нужно:

```bash
pnpm dev
```

npm видит скрипт `predev` и выполняет его перед `dev`. Запустить только подготовку, без старта приложений:

```bash
pnpm predev
```
