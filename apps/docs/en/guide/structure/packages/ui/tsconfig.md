# tsconfig.json

The config of the Vue component package:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext", "DOM"]
  },
  "include": ["src/**/*"]
}
```

## Why the DOM lib

Components run in a browser: they touch `HTMLElement`, listen for events, read node dimensions. The [base config](../../tsconfig-base) deliberately omits DOM types — it's shared by every package, the backend included, where no browser API exists.

`target: ESNext` follows the same logic: the code goes through Vite, which decides on its own what to transpile for the target browsers. Lowering the version at this level would serve no purpose.

## Why there's no outDir

The package is source-only, like [`@repo/shared`](../shared/tsconfig): `main` and `types` in `package.json` point at `src/index.ts`. Nuxt picks up the `.vue` files directly through Vite — a separate build isn't needed and would only add a step between the edit and the result.

## Type checking

```bash
pnpm --filter @repo/ui type-check
```

Here it's `vue-tsc --noEmit`, not `tsc`: the plain compiler can't parse single-file components and would trip on the first `<template>`.
