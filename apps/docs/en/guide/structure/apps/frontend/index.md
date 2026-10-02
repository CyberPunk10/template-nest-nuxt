# apps/frontend

Nuxt 4. Unlike the backend, here file placement **defines behaviour**: Nuxt scans the directories and creates routes, registers components and sets up auto-imports on its own.

```
apps/frontend/
├── app/                        application source
│   ├── assets/css/             styles processed by Vite
│   ├── components/             Vue components (auto-imported)
│   ├── composables/            composables (auto-imported)
│   ├── layouts/                page wrappers
│   ├── pages/                  file-based routing
│   ├── plugins/                code that runs at app init
│   ├── utils/                  helpers (auto-imported)
│   └── app.vue                 root component
├── server/                     server side (Nitro)
│   └── api/
│       ├── backend/            BFF proxy to NestJS
│       └── health.get.ts
├── i18n/                       @nuxtjs/i18n setup
├── public/                     served as-is: favicon, robots.txt
└── nuxt.config.ts
```

## What file placement gives you

| Directory | Convention |
| --- | --- |
| `pages/` | The filename becomes the route: `pages/tasks.vue` → `/tasks` |
| `components/` | Available in templates without an import. Nesting becomes part of the name: `components/App/Sidebar.vue` → `<AppSidebar>` |
| `composables/`, `utils/` | Exports are available everywhere without an import |
| `plugins/` | Run at startup. A numeric prefix sets the order (`01.api.ts`), a `.client` suffix means browser-only |
| `layouts/` | `default.vue` applies to every page unless stated otherwise |
| `public/` | Served from the root: `public/robots.txt` → `/robots.txt`, untouched by the bundler |

## app/ and server/ are different environments

`app/` is what reaches the browser (and gets rendered on the server during SSR). `server/` runs **only** on the server and never enters the client bundle.

Every API call goes through `server/api/backend/`: the browser talks to its own origin and Nuxt forwards the request to NestJS. That's why the backend has no CORS trouble in dev and doesn't need to be published in Docker — see [Reverse proxy](../../../reverse-proxy).

Application scripts — [package.json](./package-json).
