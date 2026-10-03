# .env[.example]

| Variable        | Value                   | Comment                                                                                                                                              |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`          | `5173`                  | VitePress dev server port. Read via `dotenv` in `.vitepress/config.ts` — VitePress itself doesn't load `.env`. Unused in Docker                      |
| `DASHBOARD_URL` | `http://localhost:3200` | Where the "View demo" button on the landing page leads. Baked into the build — the docs are static and have no runtime config. `/` in Docker (same domain behind the proxy) |

## Links to other files

- **`DASHBOARD_URL`** must match the frontend address, i.e. `PORT` in `apps/frontend/.env`. A mismatch isn't obvious right away: the docs build and open fine, but the "View demo" button lands on a port that isn't there.
- **`PORT`** — `NUXT_PUBLIC_DOCS_URL` in `apps/frontend/.env` points at it: that's where the "Documentation" menu item and the DevPanel link lead.

Change a port and check both sides. [All the links](../../../env-variables#linked-variables).

How to create a working `.env` — [ENV variables](../../../env-variables#files).
