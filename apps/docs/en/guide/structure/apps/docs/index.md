# apps/docs

VitePress. Pages are plain markdown files; the path to a file becomes its URL.

```
apps/docs/
├── .vitepress/
│   ├── config.ts               config: locales, sidebar, theme
│   ├── config/                 one file per locale
│   ├── theme/                  theme customisation, landing components
│   └── locales/                UI translations (not page content)
├── guide/                      Russian pages
├── en/guide/                   the same pages in English
├── th/guide/                   and in Thai
├── public/icons/               file icons for the sidebar
├── index.md                    landing page
└── Dockerfile                  builds the static files for the nginx image
```

## Three locales

Russian is the primary one and lives at the root (`/guide/...`). English and Thai live in subdirectories mirroring the same tree (`/en/guide/...`).

The page structure is **identical** across locales: add a file to `guide/` and add it to `en/guide/` and `th/guide/` too, otherwise the sidebars drift apart. The sidebar itself is defined per locale in `.vitepress/config/`.

## A Dockerfile that runs nothing

The `apps/docs` image starts no process: it only builds the static files that the nginx image picks up. There is no separate docs container in Compose — see [Dockerfile](./docker-image).

Application scripts — [package.json](./package-json).
