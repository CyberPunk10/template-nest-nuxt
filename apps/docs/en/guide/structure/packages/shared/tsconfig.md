# tsconfig.json

The package needs little beyond the [base one](../../tsconfig-base) — just a description of where it travels:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext"],
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

## resolveJsonModule

Translations live in `src/i18n/*/*.json` and are imported directly:

```ts
import ru from './ru.json'
```

Without this option TypeScript refuses to resolve such an import. It also types the result from the file's contents — the shape of a translation is inferred automatically.

## module, moduleResolution and target

The package is source-only: `main` and `types` in `package.json` point straight at `src/index.ts`, and there is no build. Consumers compile the sources themselves — Nuxt through Vite, the docs through VitePress, the backend as part of `nest build`.

Values are still needed: `pnpm type-check` and the IDE both work from this config. Here they describe the primary scenario, a bundler build:

| Option | Value |
| --- | --- |
| `module` | `ESNext` — native ES modules, what Vite expects |
| `moduleResolution` | `bundler` — resolution as in Vite and Rollup |
| `target` | `ESNext` — no reason to lower it, the consumer transpiles |

No `outDir` is needed: the package builds nothing, and `noEmit` comes from the base config.

When the backend compiles these sources, [its config](../../apps/backend/tsconfig) applies instead, with Node resolution — same files, different rules. So the code here is written to pass both checks.

## Why lib without DOM

The neighbouring [`packages/ui`](../ui/tsconfig) adds `DOM` to `lib`; its absence here is deliberate. This package travels to the browser and to Node alike — reaching for `window` or `document` in shared code would break the backend at runtime. Without `DOM` such an attempt becomes a type error instead of a server-side surprise.

## Type checking

```bash
pnpm --filter @repo/shared type-check
```

Plain `tsc --noEmit` — the package holds only `.ts`, no Vue components.
