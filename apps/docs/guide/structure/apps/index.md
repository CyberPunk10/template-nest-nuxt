# apps/

Три самостоятельных приложения. У каждого свой `package.json`, свой `.env` и свой `Dockerfile` — они не знают друг о друге ничего, кроме HTTP-адресов.

```
apps/
├── backend/     NestJS — REST API
├── frontend/    Nuxt 4 — интерфейс и BFF-прокси
└── docs/        VitePress — эта документация
```

| Приложение | Порт в dev | Роль |
| --- | --- | --- |
| [backend](./backend/) | `3100` | API, Swagger, валидация окружения |
| [frontend](./frontend/) | `3200` | SSR-интерфейс, проксирует запросы к API |
| [docs](./docs/) | `5173` | Статический сайт, в Docker собирается в образ nginx |

Backend не знает про frontend вовсе — связь односторонняя и только по HTTP. Frontend зависит от `@repo/shared` и `@repo/ui`, backend — только от `@repo/shared`.

Адрес соседа зависит от способа запуска. При `pnpm dev` все три процесса живут на хосте и находят друг друга по портам: Nuxt ходит в `http://localhost:3100`. В Docker каждый сидит в своём контейнере, где `localhost` — он сам, поэтому обращение идёт по имени сервиса: `http://backend:3100`. Подменой занимается `environment` в `docker-compose.yml`, сам код об этом не знает.

Наружу при этом торчит один порт reverse proxy — [Reverse proxy](../../reverse-proxy).
