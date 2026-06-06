# template-nest-nuxt

Переиспользуемый шаблон монорепозитория NestJS + Nuxt 4, завёрнутый в Docker

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?style=flat-square&logo=nuxt&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-8-F69220?style=flat-square&logo=pnpm&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js&logoColor=white)

📖 [Архитектура](docs/architecture.md) · 🗄️ [База данных](docs/database.md)

---

## Варианты

| Ветка             | Описание                  |
| ----------------- | ------------------------- |
| `main`            | Базовый шаблон — без БД   |
| `postgres-prisma` | + PostgreSQL + Prisma ORM |

```bash
# базовый вариант
git clone https://github.com/CyberPunk10/template-nest-nuxt-docker.git

# с PostgreSQL и Prisma
git clone -b postgres-prisma https://github.com/CyberPunk10/template-nest-nuxt-docker.git
```

---

## Структура

```
template-nest-nuxt/
├── apps/
│   ├── backend/        ← NestJS API (:3001)
│   └── frontend/       ← Nuxt 4 (:3000)
├── packages/
│   ├── shared/         ← @repo/shared — общие типы и i18n переводы
│   └── ui/             ← @repo/ui — общие Vue компоненты
└── ...конфиги монорепо
```

---

## Что настроено

### Монорепо

- **pnpm workspaces** — общие зависимости
- **TypeScript strict** — строгий режим, path alias `@repo/*`
- **ESLint + Prettier** — единый форматтер для всего монорепо
- **Husky + lint-staged** — проверка изменённых файлов перед коммитом

### Пакеты

- **@repo/shared** — общие TypeScript типы (DTO) и i18n переводы (ru/en/th)
- **@repo/ui** — библиотека Vue компонентов (`UiButton`, `UiBadge`, `UiCard`)
- **Proxy** — Nuxt server route проксирует `/api/backend/*` → NestJS, без CORS в dev
- **Users CRUD** — полный REST на бекенде (`GET/POST/PUT/DELETE /users`), UI на фронтенде

### Инфраструктура

- **Docker** — multi-stage образы для backend и frontend
- **docker compose** — dev и prod режимы

---

## Запуск

### Локально (dev)

Основной режим разработки — hot reload, быстрый старт:

```bash
pnpm install
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

Когда появятся внешние зависимости (БД, другие сервисы) — поднимай только их через Docker, приложения оставляй локальными:

```bash
docker compose -f docker-compose.dev.yml up -d   # только инфраструктура
pnpm dev                                          # приложения локально
```

### Локально (prod-сборка)

Проверить production-сборку без Docker:

```bash
pnpm build

# запустить backend
cd apps/backend && pnpm start:prod

# запустить frontend (в другом терминале)
cd apps/frontend && node .output/server/index.mjs
```

### Docker — оба сервиса

Собрать образы и поднять всё одной командой:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

Остановить:

```bash
docker compose down
```

### Docker — только backend

```bash
docker build -f apps/backend/Dockerfile -t my-backend .
docker run -p 3001:3001 -e PORT=3001 -e CORS_ORIGIN=http://localhost:3000 my-backend
```

### Docker — только frontend

```bash
docker build -f apps/frontend/Dockerfile -t my-frontend .
docker run -p 3000:3000 -e BACKEND_URL=http://localhost:3001 my-frontend
```

> **Важно:** при запуске контейнеров по отдельности они не видят друг друга по имени сервиса.
> Если нужно чтобы frontend достучался до backend — создай общую сеть вручную:
>
> ```bash
> docker network create my-app
> docker run -p 3001:3001 --network my-app --name backend my-backend
> docker run -p 3000:3000 --network my-app -e BACKEND_URL=http://backend:3001 my-frontend
> ```

---

## Прочие команды

```bash
pnpm install        # установить зависимости
pnpm dev            # запустить всё параллельно
pnpm build          # собрать все workspace'ы
pnpm lint           # проверить линтером
pnpm type-check     # проверить типы
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Backend health: http://localhost:3001/health
