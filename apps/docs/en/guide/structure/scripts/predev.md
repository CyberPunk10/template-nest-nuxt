# predev.mjs

Runs automatically before `pnpm dev` — via the npm `pre*` convention.

Before starting, it runs these steps in order:

1. **Copies `.env.example` → `.env`** for all four files at once (root, `apps/backend`, `apps/frontend`, `apps/docs`) — via the shared `copyEnvFiles()` from [`copy-env.mjs`](./copy-env). Not just "its own": even running before local development, it also creates the root `.env` if it's missing.
2. **Checks ports and resolves conflicts** — via the shared `checkPorts()` from [`check-ports.mjs`](./check-ports). On conflict it offers a dialog: kill the process holding the port or abort the run.

The ports checked are the dev ones: `PORT` from `apps/backend/.env`, `apps/frontend/.env` and `apps/docs/.env`.

[`predocker.mjs`](./predocker) does the same — differing only in the list of ports and in additionally setting up the Docker network.

## What it prints

Each step prints a line with its result:

```
[predev.mjs] ✓ .env: created apps/backend/.env from .env.example
[predev.mjs] ✓ ports: backend 3100 · frontend 3200 · docs 5173
```

If a step fails — a line with ✗ and the step name, and preparation stops there:

```
[predev.mjs] ✗ ports: PORT=abc in apps/backend/.env - not a valid port number (0-65535)
```

| Step    | What to check                                 | Repeat on its own |
| ------- | --------------------------------------------- | ----------------- |
| `.env`  | that `.env.example` exists next to the `.env` | `pnpm env:copy`   |
| `ports` | the `PORT` value in the named `.env`          | `pnpm predev`     |

## Usage

It runs on its own — no need to call it separately:

```bash
pnpm dev
```

npm sees the `predev` script and runs it before `dev`. To run only the preparation, without starting the applications:

```bash
pnpm predev
```
