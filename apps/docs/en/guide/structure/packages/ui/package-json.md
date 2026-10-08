# package.json

```json
{
  "name": "@repo/ui",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "vue-tsc --noEmit"
  }
}
```

| Script       | Command            | What it does                          |
| ------------ | ------------------ | ------------------------------------- |
| `type-check` | `vue-tsc --noEmit` | Type-checks, including `.vue` files   |

`vue-tsc` rather than `tsc`: the plain compiler can't parse single-file components.

There's no build — Vite handles the sources directly. `private: true` means the package is never published and is linked through `workspace:*`.

All dependencies are dev-only: `vue` for component types, `vue-tsc` and `typescript` for `type-check`. Vue itself comes from the application that uses the package.
