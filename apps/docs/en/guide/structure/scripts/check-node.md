# check-node.mjs

Checks the Node version before `pnpm dev` — [`predev.mjs`](./predev) calls it as its first step.

The required version comes from `engines.node` in the root `package.json` (currently `>=24.22.1`). If the current Node is older, preparation stops with a hint:

```
[predev.mjs] ✗ node: Node.js 24.13.0, but the project needs >=24.22.1.
  Switch this terminal:        nvm use
  Optional, for new terminals: nvm alias default 24.22.1
```

The hint depends on what the machine has:

| What is there | Hint |
|---|---|
| nvm and the required Node version | `nvm use` — switch the terminal |
| nvm, but not the required version | `nvm install` — install and switch |
| no nvm | the nvm install command (the same as on the [Setup](../../getting-started/setup) page), then `nvm install` in a new terminal |

The last line is always the optional `nvm alias default`, so new terminals start with the required version. Its version comes from `.nvmrc`, or, if there is none, the minimum from `engines.node`. nvm is a shell function, so the script detects it by the `NVM_DIR` variable. If you install Node with another version manager (fnm, Volta, asdf), the hint still suggests nvm — use your own manager.

## Why

pnpm checks `engines` too, but for each app separately: without this check `pnpm dev` fails three times with the same `ERR_PNPM_UNSUPPORTED_ENGINE` error — from Nest, Nuxt and the docs — and gives no hint what to do. Here there is one error, before the apps start.

## What is checked

Only a range of the form `>=x.y.z` is understood, as in this project. If `engines.node` is written differently (`^24`, `24.x`), the script checks nothing and does not stop the start — pnpm will handle it.
