# tsconfig.json

The only config in the repository that doesn't extend the base one: its settings come not from there but from files Nuxt generates itself. Which is why there's almost nothing here:

```json
{
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" }
  ]
}
```

## Nuxt generates the real configs

During `nuxt prepare` (which also runs as `postinstall`) Nuxt writes four configs into `.nuxt/`:

| File | For |
| --- | --- |
| `tsconfig.app.json` | `app/` — pages, components, composables |
| `tsconfig.server.json` | `server/` — API routes on nitro/h3 |
| `tsconfig.shared.json` | `shared/` — code common to the two above |
| `tsconfig.node.json` | `nuxt.config.ts` and the node environment |

The split isn't cosmetic: these layers have different global types and different auto-import sets. A component knows about `useRoute()`, a server route about `defineEventHandler()`, and mixing them up shouldn't typecheck.

## What this file does

`references` ties the four configs into one project — that's how the IDE knows which to apply to the open file. `files: []` means it checks nothing on its own.

The generated configs don't extend anything either: Nuxt writes every option out in full. There are overlaps with the [base config](../../tsconfig-base) — `strict`, `moduleResolution: Bundler`, `noEmit` — but they're set independently, from Nuxt's own defaults.

They can be changed through `typescript.tsConfig` in `nuxt.config.ts`; the template doesn't define that section, so the defaults apply.

## Type checking

```bash
pnpm --filter frontend type-check
```

Under the hood that's `nuxt typecheck`, not `tsc`. It refreshes `.nuxt/` first, then runs `vue-tsc` with the right config. Plain `tsc` won't do here: without the generated types, auto-imports and typed routes look like errors.

More in the [Nuxt documentation](https://nuxt.com/docs/guide/concepts/typescript).
