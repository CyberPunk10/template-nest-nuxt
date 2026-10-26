# Подготовка

Что нужно установить и подготовить один раз перед первым запуском.

## 1. Node.js ≥ 24.22.1

```bash
node -v
```

Версия закреплена в `.nvmrc` и `engines` корневого `package.json`. `engineStrict: true` в `pnpm-workspace.yaml` — `pnpm install` **откажется** ставить зависимости на неподходящей версии Node вместо тихой установки, которая могла бы сломаться на рантайме позже.

::: details Как установить (nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
```

Затем в корне проекта (там лежит `.nvmrc`):

```bash
nvm install 24
nvm use 24
```

Подробности — [nvm-sh/nvm](https://github.com/nvm-sh/nvm).
:::

## 2. pnpm ≥ 12

```bash
pnpm --version
```

Точная версия pnpm закреплена в `packageManager` корневого `package.json`. Подойдёт любой установленный pnpm 12 и новее: в папке проекта он сам переключится на закреплённую версию и при первом запуске скачает её.

::: details Как установить
```bash
npm install -g pnpm
```

Другие способы — [pnpm.io/installation](https://pnpm.io/installation). В папке проекта `pnpm --version` должен показать версию из `packageManager`.
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

## 4. `.env`-файлы

Копировать `.env.example` → `.env` вручную не обязательно: при первом запуске это делает скрипт-обёртка (`pnpm dev` → `predev.mjs`, `pnpm docker:up` → `predocker.mjs`). Оба создают **все** недостающие `.env` — корневой, `apps/backend`, `apps/frontend`, `apps/docs`.

Если нужно создать их заранее — например, перед прямым `docker compose up` — есть отдельная команда:

```bash
pnpm env:copy
```

Какие переменные где и почему — см. [ENV-переменные](../env-variables).
