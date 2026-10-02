# Docker

В проекте четыре независимых [Dockerfile](./dockerfiles) — по одному на приложение (`backend`, `frontend`, `docs`) плюс reverse proxy (`nginx`) — и один [docker-compose.yml](../structure/docker-compose), который собирает из них стек.

## Единая точка входа

Наружу публикуется **один порт** — `NGINX_HOST_PORT` (по умолчанию `80`). Backend и frontend объявляют свои порты через `expose`: внутри сети Docker они доступны друг другу, но на хост-машину не проброшены. Весь внешний трафик проходит через reverse proxy.

```
браузер  →  nginx:80
  │
  ├── /dev/docs/  →  /srv/docs       статика VitePress
  ├── /api/docs   →  backend:3100    Swagger UI
  └── /*          →  frontend:3200   Nuxt SSR
                          │
                          └──  backend:3100   API через BFF-прокси
```

Как устроена маршрутизация и что ещё делает прокси — см. [Reverse proxy](../reverse-proxy).

## С чего начать

- [Dockerfile](./dockerfiles) — как устроены образы: стадии, слои, версии
- [docker compose](../structure/docker-compose) — как поднять стек: переменные, сеть, запуск и остановка

Если нужно просто запустить проект — [Запуск через Docker](../getting-started/run-docker).
