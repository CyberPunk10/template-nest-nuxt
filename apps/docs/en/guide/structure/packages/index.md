# packages/

Two libraries used by the applications. They are linked as `workspace:*` — pnpm symlinks them, no registry publishing involved.

```
packages/
├── shared/      types (DTOs) and translations — for backend and frontend
└── ui/          Vue components — frontend only
```

| Package                                        | Used by           | Build       | Type check                      |
| ---------------------------------------------- | ----------------- | ----------- | ------------------------------- |
| [shared](./shared/) | backend, frontend | source-only | `tsc --noEmit`                  |
| [ui](./ui/)         | frontend          | source-only | `vue-tsc --noEmit` — for `.vue` |

Neither is compiled: `main` points straight at `src/index.ts`, and the consumers handle the sources themselves — Nest with `tsc`, Nuxt through Vite. Full breakdown — [Architecture](../../architecture#packages-how-they-re-consumed).
