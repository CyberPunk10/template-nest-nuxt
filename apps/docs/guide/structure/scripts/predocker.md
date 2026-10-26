# predocker.mjs

Запускается автоматически перед `pnpm docker:up` — через npm `pre*`-конвенцию.

Перед запуском выполняет по порядку:

1. **Копирует `.env.example` → `.env`** для всех четырёх файлов разом (корневой, `apps/backend`, `apps/frontend`, `apps/docs`) — через общую `copyEnvFiles()` из [`copy-env.mjs`](./copy-env).
2. **Проверяет порт и разрешает конфликты** — через общую `checkPorts()` из [`check-ports.mjs`](./check-ports). При конфликте предлагает диалог: убить занявший процесс или прервать запуск.
3. **Создаёт Docker-сеть**, если её ещё нет — через [`ensure-network.mjs`](./ensure-network). Имя берётся из `COMPOSE_NETWORK_NAME` в корневом `.env` — оттуда же его читает `docker-compose.yml`. Повторные запуски ничего не делают.

Проверяется единственный порт — `NGINX_HOST_PORT` из корневого `.env`. Backend и frontend хост-портов не занимают вовсе: они живут во внутренней сети. Порт БД наружу публикуется, но в проверку не входит — его держит Docker, и на уже поднятой БД это был бы ложный конфликт.

::: warning
Это срабатывает только перед `pnpm docker:up`, не перед прямым `docker compose up`. Если вызвать `docker compose up` напрямую, минуя npm-обёртку, на свежем клоне без `.env` — команда откажется стартовать: у переменных портов в `docker-compose.yml` нет дефолтов (`no port specified` без корневого `.env`), а `env_file` для `apps/*/.env` обязателен по умолчанию (`env file ... not found`). Никакой явной проверки занятости портов тоже не будет — если хост-порт занят, будет обычная Docker-ошибка `address already in use`, без диалога с предложением освободить порт. Создать недостающие `.env` заранее, не запуская ничего: `pnpm env:copy`.
:::

Аналог для локальной разработки — [`predev.mjs`](./predev).

## Что выводит

Каждый шаг пишет строку о результате:

```
[predocker.mjs] ✓ .env: files in place
[predocker.mjs] ✓ ports: nginx 80
[predocker.mjs] ✓ network: template-nest-nuxt_app created
```

Если шаг не выполнен — строка с ✗ и имя шага, дальше подготовка не идёт:

```
[predocker.mjs] ✗ network: Command failed: docker network create template-nest-nuxt_app
```

| Шаг       | Что проверить                                | Повторить отдельно                             |
| --------- | -------------------------------------------- | ---------------------------------------------- |
| `.env`    | есть ли `.env.example` рядом с нужным `.env` | `pnpm env:copy`                                |
| `ports`   | значение `NGINX_HOST_PORT` в корневом `.env` | `pnpm predocker:up`                            |
| `network` | запущен ли Docker                            | `docker network create template-nest-nuxt_app` |

## Использование

Запускается сам — отдельно вызывать не нужно:

```bash
pnpm docker:up
```

npm видит скрипт `predocker:up` и выполняет его перед `docker:up`. Запустить только подготовку, без старта контейнеров:

```bash
pnpm predocker:up
```
