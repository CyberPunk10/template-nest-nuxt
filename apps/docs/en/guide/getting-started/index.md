# Getting started

## Quick start

You need [Node.js >= 24 and pnpm](./setup) — the script handles the rest:

```bash
git clone git@github.com:CyberPunk10/template-nest-nuxt.git
cd template-nest-nuxt
pnpm install
pnpm dev
```

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
