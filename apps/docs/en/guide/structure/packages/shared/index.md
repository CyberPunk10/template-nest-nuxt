# packages/shared

Shared types and translations. The only package used by **both** applications.

```
packages/shared/
├── src/
│   ├── i18n/           translations: ru, en, th
│   └── index.ts        types (DTOs) and the export entry point
├── package.json
└── tsconfig.json       extends base, adds resolveJsonModule
```

## What to keep here

Anything that must match on the client and the server: request and response shapes, status enums, interface copy. If a type is only needed on one side, it belongs in that application, not here.

## Consumed as sources

`main` and `types` point straight at `src/index.ts`. There's no build step: the applications compile the sources as part of their own build — the backend with `tsc`, the frontend through Vite. Resolution goes through the pnpm workspace symlink, not through TypeScript `paths`.

Package manifest — [package.json](./package-json).
