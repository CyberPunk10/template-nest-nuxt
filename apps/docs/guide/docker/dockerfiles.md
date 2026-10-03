# Dockerfile

Четыре независимых `Dockerfile` — по одному на приложение плюс reverse proxy. Устроены по-разному, потому что решают разные задачи:

| Файл                       | Что делает                                                           |
| -------------------------- | -------------------------------------------------------------------- |
| `apps/backend/Dockerfile`  | собирает NestJS, финальный образ — только `dist/` и прод-зависимости |
| `apps/frontend/Dockerfile` | собирает Nuxt, финальный образ — `.output/` с Nitro-сервером         |
| `apps/docs/Dockerfile`     | собирает статику VitePress, запуск не требуется                      |
| `infra/nginx/Dockerfile`   | берёт `nginx:alpine`, кладёт конфиг и статику документации           |

**Multi-stage** у backend и frontend: этап `builder` ставит зависимости и собирает production-артефакт, этап `runner` копирует из него только результат. Финальный образ получается лёгким — без исходников и dev-зависимостей.

**Одна стадия** у docs и nginx: первому нечего запускать (его результат забирает прокси), второму нечего собирать (готовый образ уже есть).

Все команды сборки выполняются **из корня монорепозитория** — контекстом всегда служит вся репа, потому что образам нужен общий lockfile и workspace-пакеты.

## Порядок слоёв

В `builder` шаги идут так:

```
COPY манифесты  →  pnpm install --frozen-lockfile  →  COPY исходники  →  сборка
```

Порядок не случаен: Docker кэширует послойно, поэтому при изменении исходников `install` берётся из кэша. Пересобирается он только когда меняется `package.json` или lockfile.

Backend вместе с манифестами копирует `prisma/schema.prisma` и `prisma.config.ts`: клиент Prisma генерирует `postinstall` во время `install`. Поэтому у backend `install` пересобирается и при правке схемы.

## Что попадает в финальный образ

**Backend** дополнительно запускает `pnpm deploy --prod /deploy` — копирует из `node_modules` только зависимости `@repo/backend`, без лишних пакетов монорепо. Runner получает чистый плоский `node_modules`:

```
/app/
├── node_modules/     ← только зависимости @repo/backend (pnpm deploy)
└── dist/
    └── main.js       ← скомпилированный код

CMD: node dist/main
```

**Frontend** этого не делает — Nuxt сам упаковывает все зависимости в `.output` при сборке:

```
/app/
└── .output/
    ├── server/index.mjs   ← точка входа (Node.js server)
    └── public/            ← статика (JS, CSS, assets)

CMD: node .output/server/index.mjs
```

`node_modules` в runner не нужен вообще — `.output` можно скопировать на сервер и запустить без pnpm.

**Reverse proxy** получает только файлы, процесс запускает сам образ `nginx:alpine`:

```
/srv/docs/            ← статика VitePress, пришла из docs-builder
/etc/nginx/templates/ ← шаблон конфига, envsubst обработает при старте
```

## Версии базовых образов

Базовые образы запинены до minor-версии:

```dockerfile
FROM node:24.18-alpine
FROM nginx:1.31-alpine
```

Не плавающие `node:24-alpine`/`nginx:alpine` — иначе сборки в разные дни дают разный результат. И не жёсткий пин по digest: тогда патчи безопасности перестали бы приходить, пока кто-нибудь вручную не обновит хеш. Minor-тег — компромисс: версия зафиксирована, патчи прилетают сами.

## Непривилегированный пользователь

`backend` и `frontend` runner-этапы запускаются от `USER node` — встроенного непривилегированного пользователя, который уже есть в образе `node:*-alpine`:

```dockerfile
FROM node:24.18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --from=builder --chown=node:node /deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend/dist ./dist
```

Зачем: без этого процесс внутри контейнера работает от `root`. Если в приложении найдут RCE (remote code execution), атакующий сразу получит root в контейнере — что расширяет blast radius: проще эксплуатировать container escape, монтированные volume и прочее. `USER node` снижает риск без какой-либо цены.

`--chown=node:node` в `COPY` обязателен: `WORKDIR /app` создаётся ещё под `root` **до** `USER node`, и без `--chown` процесс от `node` не сможет прочитать файлы.

Для `nginx` отдельный `USER` не нужен — образ уже запускает worker-процессы от непривилегированного пользователя `nginx`.

## HEALTHCHECK

Во все `Dockerfile` с запускаемым процессом добавлен `HEALTHCHECK` — без него Docker или оркестратор (Kubernetes readiness probe, Docker Swarm, `depends_on: condition: service_healthy`) не отличит «процесс запущен» от «приложение отвечает на запросы».

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1
```

| Сервис   | Проверяемый путь                           | Интервал / start-period |
| -------- | ------------------------------------------ | ----------------------- |
| backend  | `http://127.0.0.1:${PORT}/health`          | `5s` / `60s`            |
| frontend | `http://127.0.0.1:${PORT}/api/health`      | `30s` / `5s`            |
| nginx    | `http://127.0.0.1:${NGINX_INTERNAL_PORT}/` | `30s` / `5s`            |

У backend `interval` чаще — 5 секунд вместо 30: от его healthcheck зависит `depends_on: service_healthy` у frontend, и с редким опросом старт всего стека растянулся бы на лишние полминуты. `start-period` в 60 секунд нужен потому, что перед приложением [применяются миграции](../structure/apps/backend/docker-image#миграции-при-старте).

У `docs-builder` healthcheck'а нет — там нечего проверять, образ заканчивается сборкой.

`${PORT}` в `HEALTHCHECK CMD` — не build-time подстановка, а обычная shell-переменная: читается из фактического значения внутри контейнера в момент проверки.

`wget` выбран потому, что уже есть в базовых образах — не нужно ставить `curl` отдельно.

::: tip
Явный `127.0.0.1` вместо `localhost` — не стилистическая мелочь. `/etc/hosts` внутри контейнера резолвит `localhost` в оба адреса, `127.0.0.1` и `::1`, и `wget` может пойти сначала в `::1`. Если сервис слушает только IPv4 (обычное поведение nginx и Node), попытка получает `Connection refused`, и healthcheck уходит в `unhealthy` — хотя сервис жив. Проверено вживую.
:::

Проверить статус запущенного контейнера:

```bash
docker inspect --format='{{json .State.Health}}' backend-preview
```
