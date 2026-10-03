# packages/ui

A Vue component library. Used by the frontend only.

```
packages/ui/
├── src/
│   ├── components/     UiButton, UiBadge, UiCard
│   └── index.ts
├── package.json
└── tsconfig.json       extends base, adds DOM
```

## Why it isn't compiled

The package stays as source. Only the frontend uses it, and Vite handles `.vue` and `.ts` directly — an intermediate build step isn't needed.

It couldn't be compiled with plain `tsc` anyway: `.vue` files need `vue-tsc` and a pipeline of their own. The `tsconfig.json` here only serves `vue-tsc --noEmit` during type checking.

So `main` points straight at `src/index.ts` — just like [shared](../shared/). Only the type check differs: this one needs `vue-tsc`, plain `tsc` is enough there.

## Its own TypeScript setup

It extends `tsconfig.base.json` but adds the `DOM` lib — the base config leaves it out deliberately, since it is shared with the backend too.

Package manifest — [package.json](./package-json).
