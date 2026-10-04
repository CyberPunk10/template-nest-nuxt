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

## Where to put a component

The rule is simple: the shared package holds reusable components that know nothing about the app — not the store, not the API, not the pages.

- **In the shared package** (`packages/ui/src/components/`) — simple components without app logic: buttons, badges, cards, inputs. They take data through props and report actions through events.
- **In the frontend** (`apps/frontend/app/components/`) — anything that calls the API, uses the store or knows about pages.
- **Not sure** — put it in the frontend: moving it into the package later is easy.

## Why a separate package

So that a second frontend can use the same components — most often an admin panel. If there won't be a second frontend, you can remove the package and keep the components in the frontend.

## Consumed as sources

The package stays as source. Only the frontend uses it, and Vite handles `.vue` and `.ts` directly — an intermediate build step isn't needed.

It couldn't be compiled with plain `tsc` anyway: `.vue` files need `vue-tsc` and a pipeline of their own. The `tsconfig.json` here only serves `vue-tsc --noEmit` during type checking.

So `main` points straight at `src/index.ts` — just like [shared](../shared/). Only the type check differs: this one needs `vue-tsc`, plain `tsc` is enough there.

## Its own TypeScript setup

It extends `tsconfig.base.json` but adds the `DOM` lib — the base config leaves it out deliberately, since it is shared with the backend too.

Package manifest — [package.json](./package-json).
