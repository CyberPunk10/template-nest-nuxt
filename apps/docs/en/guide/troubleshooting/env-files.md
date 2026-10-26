# Missing `.env` files

## Symptoms

```
no port specified
```

```
env file apps/backend/.env not found
```

Variables in `docker-compose.yml` have no defaults, and `.env` files are created by `predocker.mjs` — also only on `pnpm docker:up`. Create the missing `.env` files without starting anything:

```bash
pnpm env:copy
```

## New variables are missing

If `.env` files already exist, `pnpm env:copy` leaves them alone — even when new variables have appeared in `.env.example`. Add the missing ones manually or overwrite all `.env` files from `.env.example`:

```bash
pnpm env:copy:force
```

::: warning
`env:copy:force` wipes your edits in `.env`. If you changed ports or secrets, move the variables over manually.
:::
