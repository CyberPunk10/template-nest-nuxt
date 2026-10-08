# Running with pnpm

The main development mode: applications run natively, each with its own hot reload. Only PostgreSQL runs in Docker, and `pnpm dev` starts it itself.

Before the first run — [Setup](./setup).

## Cheat sheet

| Task                                     | Command                     |
| ---------------------------------------- | --------------------------- |
| Start everything                         | `pnpm dev`                  |
| Start a single application               | `pnpm --filter backend dev` |
| Preparation only, without starting       | `pnpm predev`               |
| Create missing `.env` files              | `pnpm env:copy`             |
| Overwrite all `.env` from `.env.example` | `pnpm env:copy:force`       |
| Check the production build               | `pnpm build`                |
| Stop                                     | `Ctrl+C`                    |

## pnpm dev

```bash
pnpm dev
```

One command brings up all three applications. Before it starts, [`predev.mjs`](../structure/scripts/predev) runs: it creates missing `.env` files and resolves port conflicts. Each step prints a line with ✓, and if preparation stops — a line with ✗ and the step name; what to check then is in the [step table](../structure/scripts/predev#what-it-prints).

Without `predev.mjs` the same is done by hand: copy `.env.example` to `.env` in the root and in each `apps/*` (`pnpm env:copy`), free the ports from `PORT` in `apps/*/.env`, bring the database up (`pnpm db:up`), generate the Prisma client (`pnpm db:generate`) and apply migrations (`pnpm db:migrate`).

| Service  | URL                               | Technology       |
| -------- | --------------------------------- | ---------------- |
| Backend  | `http://localhost:3100`           | NestJS `--watch` |
| Frontend | `http://localhost:3200`           | Nuxt dev         |
| Docs     | `http://localhost:5173/dev/docs/` | VitePress dev    |

Each application listens on its own port: the reverse proxy takes no part in this mode — [why](../reverse-proxy#no-proxy-in-dev-mode).

API requests go through the Nuxt BFF proxy (`/api/backend/*`), same as under Docker — that path is identical in both modes.

## A single application

`pnpm dev` starts everything at once, but you can run just one when needed:

```bash
pnpm --filter backend dev
pnpm --filter frontend dev
pnpm --filter @repo/docs dev
```

## pnpm build

Check the production build without containers:

```bash
pnpm build

# start the backend
cd apps/backend && pnpm start:prod

# start the frontend (in another terminal)
cd apps/frontend && node .output/server/index.mjs
```

This is closer to production than `pnpm dev`, but still not the same: there's no reverse proxy, and the applications are reachable directly on their own ports. For the whole layout, proxy included — [running in containers](./run-docker).

## Stopping

`Ctrl+C` in the terminal running `pnpm dev` — `concurrently` stops all three processes at once.

::: warning
If the process was killed some other way (the terminal was closed, say), child processes may survive and keep holding ports. `predev.mjs` detects that on the next run and offers to terminate them.
:::
