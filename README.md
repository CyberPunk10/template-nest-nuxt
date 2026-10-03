# template-nest-nuxt

Переиспользуемый шаблон монорепозитория NestJS + Nuxt 4, завёрнутый в Docker

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?style=flat-square&logo=nuxt&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-%E2%89%A527.5.1-2496ED?style=flat-square&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Compose-%E2%89%A55.5.0-2496ED?style=flat-square&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js&logoColor=white)

## Быстрый старт

Проверьте, что установлены Node.js, pnpm и Docker — [подготовка](apps/docs/guide/getting-started/setup.md).

```bash
npx create-nest-nuxt my-app
cd my-app
pnpm install
pnpm dev
```

Генератор спросит язык документации и вариант шаблона. Откроется на [http://localhost:3200](http://localhost:3200).

## Варианты

- `main` — минимальный: авторизацию и БД вы реализуете сами;
- `auth-session` — с готовой авторизацией, БД подключаете свою;
- `postgres-prisma` — с готовой авторизацией и БД (PostgreSQL + Prisma).

---

## Что настроено

### Монорепо

- **pnpm workspaces** — общие зависимости
- **TypeScript strict** — строгий режим, path alias `@repo/*`
- **ESLint** — статический анализ кода (неиспользуемые переменные, потенциальные ошибки)
- **Husky + lint-staged** — перед каждым коммитом автоматически запускает ESLint на изменённых файлах

### Пакеты

- **@repo/shared** — общие TypeScript типы (DTO) и i18n переводы (ru/en/th)
- **@repo/ui** — библиотека Vue компонентов (`UiButton`, `UiBadge`, `UiCard`)
- **Proxy** — Nuxt server route проксирует `/api/backend/*` → NestJS, без CORS в dev
- **Tasks CRUD** — полный REST на бекенде (`GET/POST/PUT/DELETE /tasks`), UI на фронтенде

### Backend

- **Swagger/OpenAPI** — интерактивная документация API с возможностью тестировать запросы прямо в браузере. По умолчанию поднимается везде, кроме production; управляется отдельной переменной `SWAGGER_ENABLED`
- **Exception filter** — глобальный перехватчик ошибок: клиент всегда получает единообразный JSON, непредвиденные ошибки (`500`) логируются через NestJS Logger со stack trace
- **ValidationPipe** — автоматическая валидация тела запросов через DTO: лишние поля отклоняются с `400`, типы приводятся автоматически
- **Joi** — валидация переменных окружения при старте приложения: если обязательная переменная отсутствует или имеет неверный тип — сервис не запустится с понятной ошибкой

### Инфраструктура

- **Docker** — multi-stage образы для backend и frontend, reverse proxy как единая точка входа; документация собирается в статику и раздаётся им же
- **docker compose** — поднимает nginx, backend и frontend в общей сети; наружу публикуется только порт nginx, приложения доступны лишь через него
- **`pnpm docker:up`** — обёртка над `docker compose up`: создаёт корневой `.env` из `.env.example`, проверяет занятость хост-портов

**Запуск через Docker:**

| Задача                                   | Команда                                               |
| ---------------------------------------- | ----------------------------------------------------- |
| Первый запуск и запуск после правок кода | `pnpm docker:up --build`                              |
| Запуск в фоне                            | `pnpm docker:up --build -d`                           |
| Статус и логи                            | `docker compose ps`, `docker compose logs -f backend` |
| Остановить                               | `Ctrl+C` или `docker compose down`                    |

Подробнее — [Запуск через Docker](apps/docs/guide/getting-started/run-docker.md).

## Документация

Полная документация — VitePress в [`apps/docs`](apps/docs). Локально: `pnpm --filter @repo/docs dev`, в Docker раздаётся по `/dev/docs/`.

- 🚀 [Запуск проекта](apps/docs/guide/getting-started/index.md)
  - [Подготовка](apps/docs/guide/getting-started/setup.md) — Node.js, pnpm, Docker, `.env`
  - [Через pnpm](apps/docs/guide/getting-started/run-pnpm.md) — hot reload, отдельные приложения, prod-сборка без контейнеров
  - [Через Docker](apps/docs/guide/getting-started/run-docker.md) — старт, остановка, адреса сервисов
- 🌳 [Структура проекта](apps/docs/guide/structure/index.md) — что где лежит, файл за файлом
  - 📂 [apps](apps/docs/guide/structure/apps/index.md)
    - 📂 [backend](apps/docs/guide/structure/apps/backend/index.md) — 🐳 [Dockerfile](apps/docs/guide/structure/apps/backend/docker-image.md) · ⚙️ [.env.example](apps/docs/guide/structure/apps/backend/env-example.md) · 📦 [package.json](apps/docs/guide/structure/apps/backend/package-json.md)
    - 📂 [frontend](apps/docs/guide/structure/apps/frontend/index.md) — 🐳 [Dockerfile](apps/docs/guide/structure/apps/frontend/docker-image.md) · ⚙️ [.env.example](apps/docs/guide/structure/apps/frontend/env-example.md) · 📦 [package.json](apps/docs/guide/structure/apps/frontend/package-json.md)
    - 📂 [docs](apps/docs/guide/structure/apps/docs/index.md) — 🐳 [Dockerfile](apps/docs/guide/structure/apps/docs/docker-image.md) · ⚙️ [.env.example](apps/docs/guide/structure/apps/docs/env-example.md) · 📦 [package.json](apps/docs/guide/structure/apps/docs/package-json.md)
  - 📂 [packages](apps/docs/guide/structure/packages/index.md)
    - 📂 [shared](apps/docs/guide/structure/packages/shared/index.md) — типы и переводы · 📦 [package.json](apps/docs/guide/structure/packages/shared/package-json.md)
    - 📂 [ui](apps/docs/guide/structure/packages/ui/index.md) — Vue-компоненты · 📦 [package.json](apps/docs/guide/structure/packages/ui/package-json.md)
  - 📂 [infra](apps/docs/guide/structure/infra/index.md)
    - 📂 [nginx](apps/docs/guide/structure/infra/nginx/index.md) — 🐳 [Dockerfile](apps/docs/guide/structure/infra/nginx/docker-image.md)
  - 📂 [scripts](apps/docs/guide/structure/scripts/index.md) — Node-скрипты за pnpm-командами
  - 📂 [.husky](apps/docs/guide/structure/husky/index.md) — хук перед коммитом
  - 🐳 [docker-compose.yml](apps/docs/guide/structure/docker-compose.md) · ⚙️ [.env.example](apps/docs/guide/structure/env-example.md) · 📦 [package.json](apps/docs/guide/structure/package-json.md)
- 🕸️ [Архитектура](apps/docs/guide/architecture.md) — зависимости пакетов, TypeScript-конфиги
- ⚙️ [Переменные окружения](apps/docs/guide/env-variables.md) — порты, CORS, пустые значения
- 🐳 [Docker](apps/docs/guide/docker/index.md) — единая точка входа, [устройство образов](apps/docs/guide/docker/dockerfiles.md)
- 🔀 [Reverse proxy](apps/docs/guide/reverse-proxy.md)
- 📦 [pnpm и Corepack](apps/docs/guide/pnpm.md)

---
