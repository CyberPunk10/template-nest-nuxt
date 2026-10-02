# package.json

The frontend application's manifest. Its scripts work only inside their own workspace — from the root they're called through a filter (`pnpm --filter frontend dev`) or transitively from the root commands.

| Script        | Command          | What it does                                                                  |
| ------------- | ---------------- | ----------------------------------------------------------------------------- |
| `dev`         | `nuxt dev`       | Local development with hot-reload                                             |
| `build`       | `nuxt build`     | Production build into `.output/`                                              |
| `preview`     | `nuxt preview`   | Runs the production build locally                                             |
| `generate`    | `nuxt generate`  | Static build. Unused in this template: the image runs SSR                     |
| `postinstall` | `nuxt prepare`   | Generates `.nuxt/` (types, aliases) — runs automatically after `pnpm install` |
| `lint`        | `eslint . --fix` | Linter with auto-fix                                                          |
| `type-check`  | `nuxt typecheck` | Type-checks via `vue-tsc`                                                     |

What lives where — [apps/frontend](./).
