# Setup

What to install and prepare once, before the first run.

## 1. Node.js >= 24.22.1

```bash
node -v
```

The version is pinned in `.nvmrc` and in `engines` of the root `package.json`. `engineStrict: true` in `pnpm-workspace.yaml` makes `pnpm install` **refuse** to install on a wrong Node version instead of installing silently and breaking at runtime later.

::: details How to install (nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
```

Then, in the project root (where `.nvmrc` lives):

```bash
nvm install   # version from .nvmrc
nvm use
```

Details — [nvm-sh/nvm](https://github.com/nvm-sh/nvm).
:::

## 2. pnpm >= 12

```bash
pnpm --version
```

The exact pnpm version is pinned in `packageManager` of the root `package.json`. Any installed pnpm 12 or newer will do: inside the project folder it switches to the pinned version on its own and downloads it on first run.

::: details How to install
```bash
npm install -g pnpm
```

Other options — [pnpm.io/installation](https://pnpm.io/installation). Inside the project folder `pnpm --version` should show the version from `packageManager`.
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

## 4. `.env` files

You don't have to copy `.env.example` → `.env` by hand: on the first run the wrapper script does it (`pnpm dev` → `predev.mjs`, `pnpm docker:up` → `predocker.mjs`). Both create **all** missing `.env` files — root, `apps/backend`, `apps/frontend`, `apps/docs`.

To create them ahead of time — say, before a plain `docker compose up` — there's a separate command:

```bash
pnpm env:copy
```

Which variables live where and why — see [ENV variables](../env-variables).
