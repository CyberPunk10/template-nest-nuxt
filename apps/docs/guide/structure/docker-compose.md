# docker compose

`docker-compose.yml` поднимает `nginx`, `backend` и `frontend` в общей сети.

Документация отдельным сервисом не поднимается: её статику собирает `docs-builder` и отдаёт тот же `nginx` — подробнее в [apps/docs](./apps/docs/docker-image).

## Запуск

Обычный способ — штатная команда Compose:

```bash
docker compose up
```

Но на свежем клоне она сразу не сработает: не хватает `.env`-файлов и Docker-сети, а порт прокси может оказаться занят.

Чтобы не делать это вручную, добавлен скрипт, который можно вызвать командой:

```bash
pnpm docker:up
```

Перед стартом она вызывает [`predocker.mjs`](./scripts/predocker), который создаёт недостающие `.env`, проверяет порт прокси и заводит сеть, — а дальше передаёт управление тому же `docker compose up`. Поэтому сразу после клонирования достаточно одной этой команды.

Когда окружение уже подготовлено, разницы нет: можно пользоваться `docker compose` напрямую. Команды выполняются **из корня монорепозитория**, флаг `--build` пересобирает образы перед стартом.

После запуска всё доступно на одном порту:

- Приложение: [http://localhost/](http://localhost/)
- Документация: [http://localhost/dev/docs/](http://localhost/dev/docs/)
- Swagger UI: [http://localhost/api/docs](http://localhost/api/docs) (если включён — см. `SWAGGER_ENABLED`)

## Сеть

Сеть объявлена как `external: true` — `docker compose` **не создаёт** её сам, ожидает готовой:

```bash
docker network create template-nest-nuxt_app
```

Без этого прямой `docker compose up` упадёт с `network ... declared as external, but could not be found`. При запуске через `pnpm docker:up` сеть создаётся автоматически.

Имя сети задаётся переменной `COMPOSE_NETWORK_NAME` в корневом `.env` — её читают и `docker-compose.yml`, и `ensure-network.mjs`. Если переменной нет, обе стороны скажут об этом явно.

Почему сеть внешняя, а не создаётся Compose'ом: к ней подключаются контейнеры из **других** compose-файлов — например, `docker-compose.dev.yml` с postgres на ветках с БД. Ни один файл не владеет сетью единолично, поэтому её создают снаружи; иначе порядок запуска стал бы значимым.

## Остановка

```bash
docker compose down
```

Сеть `template-nest-nuxt_app` при этом не удаляется (она `external`, `compose` её не создавал — не ему и убирать). Удалить вручную, если она больше не нужна:

```bash
docker network rm template-nest-nuxt_app
```

::: warning
`docker compose down --remove-orphans` удалит и контейнеры из соседних compose-файлов, подключённые к той же сети — например, postgres на ветках с БД. Данные при этом останутся в volume, но контейнер придётся поднимать заново.
:::

## Все .env-файлы обязательны

Без корневого `.env` `docker compose up` откажется стартовать (`no port specified`). Без `apps/backend/.env`/`apps/frontend/.env` — тоже, с ошибкой `env file ... not found`. Ни то, ни другое не подставляется тихо — это осознанный выбор, а не забытые дефолты.

В репозитории лежат только `.env.example`. Рабочие `.env` можно создать вручную или командой:

```bash
pnpm env:copy
```

Подробнее — см. [ENV-переменные](../env-variables#фаилы).

## `env_file` и override

`backend` и `frontend` подключают свой `apps/*/.env` через `env_file:` — этот же файл используется и для `pnpm dev`.

```yaml
backend:
  env_file: apps/backend/.env
```

Файлы `.env` обязательны — без них `docker compose up` откажется стартовать (`env file ... not found`).

Иногда значение должно **отличаться** для Docker — например, `NUXT_BACKEND_URL`: в `apps/frontend/.env` он `http://localhost:3100` (верно для `pnpm dev`, где всё на хосте), но внутри Docker-сети `localhost` для frontend-контейнера — это сам контейнер, а не backend. Для таких случаев `environment:` в `docker-compose.yml` **явно переопределяет** значение из файла — `environment:` всегда важнее `env_file:`:

```yaml
frontend:
  env_file: apps/frontend/.env
  environment:
    NUXT_BACKEND_URL: http://backend:3100   # переопределяет localhost:3100 из .env
```

Тем же способом Docker-запуск переводится в production-режим:

```yaml
backend:
  environment:
    NODE_ENV: production   # в apps/backend/.env лежит development — для pnpm dev
```

Подробнее про то, какие переменные совпадают, а какие переопределяются — см. [ENV-переменные](../env-variables).

## Внутренние порты

Хост-порт публикует только прокси. У приложений есть лишь внутренний порт — он приходит из корневого `.env`:

```yaml
backend:
  expose:
    - '${BACKEND_INTERNAL_PORT}'
  env_file: apps/backend/.env
  environment:
    PORT: '${BACKEND_INTERNAL_PORT}'   # переопределяет PORT из .env
```

Выглядит странно: `PORT` уже лежит в `apps/backend/.env`, зачем задавать его второй раз через `BACKEND_INTERNAL_PORT`?

Дело в том, что Compose и контейнер читают переменные в разное время:

| Кто читает           | Откуда                     | Когда                                        |
| -------------------- | -------------------------- | -------------------------------------------- |
| Compose              | корневой `.env`            | при чтении `docker-compose.yml` — до запуска |
| Процесс в контейнере | `env_file` + `environment` | при старте контейнера                        |

Compose подставляет `${BACKEND_INTERNAL_PORT}` в тот момент, когда контейнера ещё нет — а значит, и содержимого `apps/backend/.env` он в этот момент не видит: этот файл попадёт внутрь позже. Поэтому всё, что нужно самому Compose, живёт в корневом `.env`.

**Что это значит на практике.** Порт контейнера задаётся в корневом `.env`:

```bash
BACKEND_INTERNAL_PORT=3100
```

А `PORT` в `apps/backend/.env` для Docker не работает: строка `environment: PORT` перекрывает его при старте, потому что `environment` в Compose всегда сильнее `env_file`. Этот `PORT` нужен другому — запуску через `pnpm dev`, где Docker не участвует.

### Почему не хватает ENV в Dockerfile

Порт там уже задан:

```dockerfile
ENV PORT=3100
```

Казалось бы, этого достаточно и `environment` в compose лишний. Но приоритет переменных таков:

```
ENV в Dockerfile  →  env_file  →  environment
     слабее                          сильнее
```

`env_file: apps/backend/.env` перебивает `ENV`. Без строки `environment: PORT` в контейнер уехало бы значение из личного `.env` разработчика — а он предназначен для `pnpm dev` и может быть любым: поменяли локально на 3300, и Docker сломался.

То есть `environment: PORT` защищает не от Dockerfile, а от `env_file`. Сам `ENV PORT` при этом остаётся полезным: с ним образ работает и без compose — `docker run` поднимет его на 3100 без единой переменной.
