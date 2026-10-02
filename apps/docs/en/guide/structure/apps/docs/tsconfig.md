# tsconfig.json

Type checking for the VitePress theme: Vue components and `.vitepress/config.ts`. VitePress builds the documentation itself; this config is only for types.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext", "DOM"],
    "types": ["vitepress/client", "node"],
    "resolveJsonModule": true
  },
  "include": [".vitepress/**/*.ts", ".vitepress/**/*.vue"],
  "exclude": [".vitepress/dist", ".vitepress/cache"]
}
```

## target and lib

The theme runs in a browser, so DOM types are required: `document`, `window`, `HTMLElement`. The [base config](../../tsconfig-base) deliberately omits them — it isn't tied to an environment, and the backend runs somewhere else entirely.

## types: why vitepress/client

The `vitepress/client` package re-exports `vite/client`, which declares the `*.vue`, `*.css` and other asset modules. Without it any component import in the theme is flagged:

```
Cannot find module './components/Home/HomeHero.vue'
```

`node` is for `config.ts` itself — it runs in Node: reads `process.env`, builds paths through `path` and `url`.

## resolveJsonModule

Interface translations live in `.vitepress/locales/*.json` and are imported directly. Without this option TypeScript refuses to resolve such an import.

## Type checking

```bash
pnpm --filter @repo/docs type-check
```

Runs `vue-tsc --noEmit` rather than plain `tsc`: the latter can't parse `.vue` and would report a syntax error in every component.
