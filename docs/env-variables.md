# ENV-переменные

## Файлы

```
apps/backend/.env[.example]  # Читает NestJS напрямую
apps/frontend/.env[.example] # Читает Nuxt напрямую
```

- Каждое приложение читает **только свой** `.env`
- Если `.env` отсутствует, он **автоматически** копируется из `.env.example` при запуске `pnpm dev` (с помощью `predev.mjs`)

---

## Почему переменные повторяются

### `BACKEND_URL` vs `NUXT_PUBLIC_BACKEND_URL`

Оба — «адрес бэкенда», но для разных потребителей:

| Переменная                | Файл                 | Кто читает        | Значение                               |
| ------------------------- | -------------------- | ----------------- | -------------------------------------- |
| `BACKEND_URL`             | `apps/frontend/.env` | Nuxt SSR (сервер) | `http://localhost:3001` при `pnpm dev` |
| `NUXT_PUBLIC_BACKEND_URL` | `apps/frontend/.env` | Браузер           | `http://localhost:3001`                |

В Docker оба значения передаются напрямую через `docker-compose.yml`: `BACKEND_URL` как `http://backend:3001` (имя сервиса внутри Docker-сети), `NUXT_PUBLIC_BACKEND_URL` как `http://localhost:3001`.

`NUXT_PUBLIC_` — обязательный префикс Nuxt для переменных, доступных браузеру. Убрать дублирование нельзя: это ограничение фреймворка.

### `CORS_ORIGIN`

Только в `apps/backend/.env` для локального запуска (`pnpm dev`). В Docker передаётся напрямую через `docker-compose.yml`.

---

## Схема: что откуда читается

### `pnpm dev`

```
apps/backend/.env   →  PORT, CORS_ORIGIN
apps/frontend/.env  →  PORT, NUXT_PUBLIC_BACKEND_URL, BACKEND_URL
```

### Docker

```
docker-compose.yml (значения захардкожены)
  backend:   PORT=3001, CORS_ORIGIN=http://localhost:3000
  frontend:  NUXT_PUBLIC_API_BASE=/api/backend,
             NUXT_PUBLIC_APP_ENV=production,
             NUXT_PUBLIC_BACKEND_URL=http://localhost:3001,
             BACKEND_URL=http://backend:3001
```

---

## `predev.mjs`

Запускается автоматически перед `pnpm dev` (npm `pre*` соглашение). Делает две вещи:

1. Если `apps/backend/.env` или `apps/frontend/.env` отсутствует — копирует из `.env.example`
2. Если нужный порт занят — предлагает убить процесс на нём или прервать запуск
