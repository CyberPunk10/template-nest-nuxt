# Нет файлов `.env`

## Симптомы

```
no port specified
```

```
env file apps/backend/.env not found
```

У переменных в `docker-compose.yml` нет значений по умолчанию, а `.env` создаёт `predocker.mjs` — тоже только при `pnpm docker:up`. Создать недостающие `.env` без запуска:

```bash
pnpm env:copy
```

## Не хватает новых переменных

Если `.env` уже есть, `pnpm env:copy` их не трогает — даже когда в `.env.example` появились новые переменные. Допишите недостающие вручную или перезапишите все `.env` из `.env.example`:

```bash
pnpm env:copy:force
```

::: warning
`env:copy:force` затирает ваши правки в `.env`. Если вы меняли порты или секреты — перенесите переменные вручную.
:::
