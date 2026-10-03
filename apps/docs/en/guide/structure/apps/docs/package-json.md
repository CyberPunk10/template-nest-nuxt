# package.json

The documentation's manifest. Its scripts are called through a filter (`pnpm --filter @repo/docs dev`) or transitively from the root commands.

| Script    | Command             | What it does                         |
| --------- | ------------------- | ------------------------------------ |
| `dev`     | `vitepress dev`     | Local docs dev server                |
| `build`   | `vitepress build`   | Static build into `.vitepress/dist/` |
| `preview` | `vitepress preview` | Runs the built docs locally          |
| `type-check` | `vue-tsc --noEmit` | Type-checks the config and the theme's Vue components |

The filter here is the full package name `@repo/docs`, not `docs` like the other applications.

What lives where — [apps/docs](./).
