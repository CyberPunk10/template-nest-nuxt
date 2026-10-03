# Setup

What to install and prepare once, before the first run.

## 1. Node.js >= 24

```bash
node -v
```

The version is pinned in `.nvmrc` and in `engines` of the root `package.json`. `.npmrc` sets `engine-strict=true`, so `pnpm install` **refuses** to install on a wrong Node version instead of installing silently and breaking at runtime later.

::: details How to install (nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
```

Then, in the repository root (where `.nvmrc` lives):

```bash
nvm install 24
nvm use 24
```

Details — [nvm-sh/nvm](https://github.com/nvm-sh/nvm).
:::

## 2. pnpm >= 11 via Corepack

```bash
pnpm --version
```

The pnpm version is pinned in `packageManager` of the root `package.json` — the recommended way to get it is [Corepack](https://nodejs.org/api/corepack.html), built into Node.js.

::: details How to install (Corepack)
```bash
corepack enable
```

From then on, `pnpm` in this project is the version listed in `packageManager`. If another pnpm is installed globally, it may intercept the call before the Corepack shim and substitute a different version. Check with `pnpm --version`, and if it differs from `packageManager`, see [pnpm and Corepack](../pnpm).
:::

## 3. Docker >= 23 + Docker Compose >= 2.33

Needed only for Docker mode — skip it for `pnpm dev`.

```bash
docker --version
docker compose version
```

The Compose version matters: on an older one the build fails with `failed to get build context docs` — [why](../structure/apps/docs/docker-image).

The template was verified on Docker `27.5.1` and Compose `v5.5.0`.

::: details How to install
Full instructions for your OS — [docs.docker.com/get-started/get-docker](https://docs.docker.com/get-started/get-docker/).

Quick path for Linux:

```bash
curl -fsSL https://get.docker.com | sh
```
:::

## 4. Docker network

Also Docker-only. When you start with `pnpm docker:up` it is created automatically — no separate step needed.

If you run `docker compose` directly, create it once yourself:

```bash
docker network create template-nest-nuxt_app
```

Without it, a plain `docker compose up` fails with `network ... declared as external, but could not be found` — [why the network is external](../structure/docker-compose#network).

## 5. `.env` files

You don't have to copy `.env.example` → `.env` by hand: on the first run the wrapper script does it (`pnpm dev` → `predev.mjs`, `pnpm docker:up` → `predocker.mjs`). Both create **all** missing `.env` files — root, `apps/backend`, `apps/frontend`, `apps/docs`.

To create them ahead of time — say, before a plain `docker compose up` — there's a separate command:

```bash
pnpm env:copy
```

Which variables live where and why — see [ENV variables](../env-variables).

::: tip
When switching branches, the local `.env` doesn't update automatically — it may be missing variables introduced by the new branch. Compare it against `.env.example` and add whatever's missing.
:::
