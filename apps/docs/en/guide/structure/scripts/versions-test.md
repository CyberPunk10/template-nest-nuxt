# versions.test.mjs

A test that checks the Node version is written the same way everywhere in the project. It runs first in `pnpm test`.

| Place | What is checked |
|---|---|
| `.nvmrc` | an exact version like `24.22.1` — used by `nvm use`, CI and the check in [`predev.mjs`](./predev) |
| `engines.node` in the root `package.json` | exactly `>=` the version from `.nvmrc` |
| `FROM node:…` in the Dockerfiles of `apps/*` and `infra/*` | the same major and minor as `.nvmrc`: `node:24.22-alpine` for `24.22.1` |

## Why

When updating Node, it is easy to change `.nvmrc` and forget a Dockerfile: everything works locally on the new version, while the Docker images stay on the old one. The test fails and names the file:

```
apps/frontend/Dockerfile: node:24.21-alpine, but .nvmrc has 24.22.1
```

## Usage

```bash
pnpm test                                # together with the other tests
node --test scripts/versions.test.mjs    # this check only
```
