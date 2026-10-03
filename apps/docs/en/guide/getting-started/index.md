# Getting started

## Quick start

Make sure Node.js, pnpm and Docker are installed — [setup](./setup).

```bash
npx create-nest-nuxt my-app
cd my-app
pnpm install
pnpm dev
```

`create-nest-nuxt` asks two questions:

1. **Language** — English, Russian or Thai. The documentation inside the project (`apps/docs`) will be in it.
2. **Template variant:**
   - `main` — the minimal one: you implement authentication and the database yourself;
   - `auth-session` — with ready-made authentication; you plug in your own database;
   - `postgres-prisma` — with ready-made authentication and a database (PostgreSQL + Prisma).

It opens at [http://localhost:3200](http://localhost:3200). Everything else on this page is about how this mode differs from Docker, and what to configure if something didn't start.

## How to run it

Where the applications run and which build they are, are independent choices. Three of the four combinations are set up in the template:

|          | On the host                                                                  | In containers                                            |
| -------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| **dev**  | [`pnpm dev`](./run-pnpm)                             | not set up                                               |
| **prod** | [`pnpm build` + `start:prod`](./run-pnpm#pnpm-build) | [`pnpm docker:up`](./run-docker) |

- Everyday work is `pnpm dev`.
- To exercise the production build as a whole, reverse proxy included, use `pnpm docker:up`.

How you reach them differs too:

- On the host each application listens on its own port.
- In containers all traffic arrives at the reverse proxy.

## Where to start

1. [Setup](./setup) — Node.js, pnpm, Docker, `.env` files
2. [Run with pnpm](./run-pnpm) or [with Docker](./run-docker)

## What differs in practice

| What          | `pnpm dev`                        | `pnpm docker:up`             |
| ------------- | --------------------------------- | ---------------------------- |
| Application   | `http://localhost:3200`           | `http://localhost/`          |
| Documentation | `http://localhost:5173/dev/docs/` | `http://localhost/dev/docs/` |
| Swagger       | `http://localhost:3100/api/docs`  | `http://localhost/api/docs`  |
| Hot reload    | yes                               | no — production images       |
| Reverse proxy | no                                | yes                          |

The paths match — only the host and port differ. Addresses live in environment variables so the code doesn't need to know them.
