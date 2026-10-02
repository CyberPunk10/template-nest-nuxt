# Подготовка

Что нужно установить и подготовить один раз перед первым запуском.

## 1. Node.js ≥ 24

```bash
node -v
```

Версия закреплена в `.nvmrc` и `engines` корневого `package.json`. `.npmrc` содержит `engine-strict=true` — `pnpm install` **откажется** ставить зависимости на неподходящей версии Node вместо тихой установки, которая могла бы сломаться на рантайме позже.

::: details Как установить (nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
```

Затем в корне репозитория (там лежит `.nvmrc`):

```bash
nvm install 24
nvm use 24
```

Подробности — [nvm-sh/nvm](https://github.com/nvm-sh/nvm).
:::

## 2. pnpm ≥ 11 через Corepack

```bash
pnpm --version
```

Версия pnpm закреплена в `packageManager` корневого `package.json` — рекомендуемый способ её получить — [Corepack](https://nodejs.org/api/corepack.html), встроенный в Node.js.

::: details Как установить (Corepack)
```bash
corepack enable
```

Дальше `pnpm` в этом проекте будет той версией, что указана в `packageManager`. Если уже есть другой pnpm, установленный глобально — он может перехватывать вызов раньше Corepack-шима, подставляя другую версию `pnpm`. Проверьте версию `pnpm --version` и если она отличается от той, что указана в `packageManager`, то ознакомьтесь с этим разделом [pnpm и Corepack](../pnpm).
:::

## 3. Docker ≥ 23 + Docker Compose ≥ 2.33

Нужны только для Docker-режима — для `pnpm dev` можно пропустить.

```bash
docker --version
docker compose version
```

Версия Compose важна: на более старой сборка упадёт с `failed to get build context docs` — [почему](../structure/apps/docs/docker-image).

Шаблон проверялся на Docker `27.5.1` и Compose `v5.5.0`.

::: details Как установить
Полная инструкция под вашу ОС — [docs.docker.com/get-started/get-docker](https://docs.docker.com/get-started/get-docker/).

Быстрый путь для Linux:

```bash
curl -fsSL https://get.docker.com | sh
```
:::

## 4. Docker-сеть

Тоже только для Docker-режима. При запуске через `pnpm docker:up` создаётся автоматически — отдельный шаг не требуется.

Если запускаете `docker compose` напрямую, создайте её один раз сами:

```bash
docker network create template-nest-nuxt_app
```

Без неё прямой `docker compose up` упадёт с ошибкой `network ... declared as external, but could not be found` — [почему сеть внешняя](../structure/docker-compose#сеть).

## 5. `.env`-файлы

Копировать `.env.example` → `.env` вручную не обязательно: при первом запуске это делает скрипт-обёртка (`pnpm dev` → `predev.mjs`, `pnpm docker:up` → `predocker.mjs`). Оба создают **все** недостающие `.env` — корневой, `apps/backend`, `apps/frontend`, `apps/docs`.

Если нужно создать их заранее — например, перед прямым `docker compose up` — есть отдельная команда:

```bash
pnpm env:copy
```

Какие переменные где и почему — см. [ENV-переменные](../env-variables).

::: tip
При переключении веток локальный `.env` не обновляется автоматически — в нём могут отсутствовать переменные новой ветки. Сверьте с `.env.example` и добавьте недостающие.
:::
