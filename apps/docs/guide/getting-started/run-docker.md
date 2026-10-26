# Запуск через Docker

Приложения выполняются в контейнерах, за единой точкой входа — те же образы, что уедут в деплой.

Образы production-сборки, hot-reload в них нет, правка кода видна только после пересборки. Для работы над кодом используйте [`pnpm dev`](./run-pnpm).

Перед первым запуском — [Подготовка](./setup).

## Шпаргалка

| Задача                                     | Команда                                                  |
| ------------------------------------------ | -------------------------------------------------------- |
| Первый запуск и запуск после правок кода   | `pnpm docker:up --build`                                 |
| Запуск без пересборки — образы уже собраны | `pnpm docker:up`                                         |
| Запуск в фоне                              | `pnpm docker:up --build -d`                              |
| Что запущено и в каком состоянии           | `docker compose ps`                                      |
| Логи сервиса в реальном времени            | `docker compose logs -f backend`                         |
| Остановить                                 | `Ctrl+C`, а для фонового запуска — `docker compose down` |

Флаги после `pnpm docker:up` передаются в `docker compose up` как есть.

::: tip
Без `--build` compose берёт уже собранные образы — свежие правки кода в контейнер не попадут. Если изменения «не видны», первым делом пересоберите.
:::

## Старт

```bash
pnpm docker:up --build
```

`pnpm docker:up` — не просто алиас для `docker compose up`: перед стартом отрабатывает [`predocker.mjs`](../structure/scripts/predocker), который создаёт недостающие `.env`, проверяет порт прокси и заводит Docker-сеть. Поэтому команда работает сразу после клонирования.

Под капотом это `docker compose --profile app up`: сервисы приложения помечены профилем `app`, а БД профиля не имеет и поднимается всегда — см. [профили](../structure/docker-compose#профили).

Наружу смотрит только reverse proxy — всё приходит на один порт (`NGINX_HOST_PORT`, по умолчанию `80`):

- Приложение: [http://localhost/](http://localhost/)
- Документация: [http://localhost/dev/docs/](http://localhost/dev/docs/)
- Swagger UI: [http://localhost/api/docs](http://localhost/api/docs) (если включён — см. `SWAGGER_ENABLED`)

Backend и frontend своих хост-портов не занимают: снаружи они недоступны, только через прокси — [почему](../reverse-proxy#почему-порты-приложении-закрыты).

::: warning
Прямой вызов Compose, минуя `pnpm docker:up`, тоже работает, но требует профиля и идёт без подготовки: `docker compose up` без `--profile app` поднимет только БД, без корневого `.env` откажется стартовать (`no port specified`), без `apps/*/.env` — тоже (`env file ... not found`). При занятом порте выдаст обычную Docker-ошибку `address already in use`, без диалога.

Без Docker-сети тоже не стартует: `network ... declared as external, but could not be found` — [почему сеть внешняя](../structure/docker-compose#сеть). Подготовить всё заранее:

```bash
pnpm env:copy
docker network create template-nest-nuxt_app
```
:::

## Остановка

```bash
docker compose --profile app down
```

Профиль нужен и здесь: без него Compose не увидит сервисы приложения и погасит только БД. Чтобы, наоборот, остановить приложения и оставить БД поднятой:

```bash
docker compose --profile app stop nginx backend frontend
```

Сеть `template-nest-nuxt_app` при этом остаётся — она `external`, compose её не создавал. Удалить вручную, если больше не нужна:

```bash
docker network rm template-nest-nuxt_app
```

::: warning
`docker compose down --remove-orphans` заодно удалит контейнеры из соседних compose-файлов, подключённые к той же сети — например, postgres на ветках с БД. Данные останутся в volume, но контейнер придётся поднимать заново.
:::

## Отдельный сервис

Собрать и запустить один контейнер, без compose — например, для точечной проверки образа. Команды по каждому сервису — в разделе [Docker](../docker/).

## Что дальше

- [Docker](../docker/) — как устроены образы, `env_file` против `environment`, `HEALTHCHECK`, `USER node`
- [Reverse proxy](../reverse-proxy) — маршрутизация, конфиг nginx, заголовки безопасности
