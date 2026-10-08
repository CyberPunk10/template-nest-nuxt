# package.json

```json
{
  "name": "@repo/shared",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

| Script       | Command        | What it does              |
| ------------ | -------------- | ------------------------- |
| `type-check` | `tsc --noEmit` | Type-checks without building |

There's no `build` script: `main` and `types` point straight at `src/index.ts` — the package is consumed as sources, and the applications handle the compiling.

`private: true` — the package is never published to a registry; it's linked through `workspace:*`.

The only dependency is `typescript` in `devDependencies`, for the `type-check` script.
