# Reverse proxy

In Docker mode a single service faces outward — nginx from `infra/nginx/`. It accepts all external traffic and routes it to the apps on the internal network.

```
browser  →  nginx:80
  │
  ├── /dev/docs/  →  /srv/docs       VitePress static files
  ├── /api/docs   →  backend:3100    Swagger UI
  └── /*          →  frontend:3200   Nuxt SSR
                          │
                          └──→  backend:3100   API via the BFF proxy
```

nginx itself serves only two routes: it reads the documentation off disk and proxies Swagger to the backend. Everything else, including API requests (`/api/backend/*`), goes to Nuxt — for nginx they're indistinguishable from ordinary frontend requests. Nuxt then forwards them to the backend itself.

## Why the app ports are closed

`backend` and `frontend` declare their port with `expose` rather than `ports` — it's visible inside the Docker network, but not forwarded to the host. The proxy publishes the only port.

```yaml
backend:
  expose:
    - '${BACKEND_INTERNAL_PORT}'
```

An app behind a proxy shouldn't be reachable around it: otherwise the security headers, limits and routing the proxy sets up lose their meaning. Fewer open ports mean a smaller attack surface — that's ordinary production practice.

If you need to reach a service directly, say to tell whether the problem is in the proxy or in the app itself:

```bash
docker compose exec backend wget -qO- http://localhost:3100/health
```

## Why `infra/`, not `apps/`

Monorepo convention reserves `apps/` for applications and `packages/` for reusable libraries. The proxy is neither: it has no `package.json`, doesn't take part in `pnpm install`, and isn't built by the workspace. It's infrastructure configuration, so it lives in `infra/` — a directory that will naturally hold the rest of the operational glue over time (monitoring, deployment scripts).

## What the config does

`infra/nginx/nginx.conf.tpl` handles more than routing.

**Documentation as static files.** `/dev/docs/` is served from disk via `alias` rather than proxied to a separate service:

```nginx
location /dev/docs/ {
    alias /srv/docs/;
    try_files $uri $uri.html $uri/index.html =404;
    error_page 404 /dev/docs/404.html;
}
```

`alias`, not `root`: the on-disk path (`/srv/docs/`) doesn't mirror the URL (`/dev/docs/`), and `alias` replaces the matched prefix whereas `root` would append it.

`$uri.html` is needed because VitePress builds pages as files like `guide/x.html` but links to them without the extension. The trailing `=404` is mandatory: without it a nonexistent page would be served with status **200** — right body, wrong status.

**Asset caching.** Files under `/dev/docs/assets/` are built with a hash in the name: the content behind such a URL never changes, so the browser is allowed to skip revalidation:

```nginx
location /dev/docs/assets/ {
    alias /srv/docs/assets/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Security headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, plus `server_tokens off` so the nginx version stays out of responses and error pages.

::: warning add_header is not inherited
If a nested `location` declares **its own** `add_header`, the parent headers stop applying there — all of them, not one by one. That's why the security headers are repeated explicitly in `/dev/docs/assets/`, where `Cache-Control` is set. This is a common source of gaps: the headers are "in the config" but never reach some routes.
:::

**WebSocket.** The `Upgrade`/`Connection` headers are forwarded to Nuxt so HMR keeps working if the frontend ever ends up behind the proxy in dev mode:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

The `map` is needed because a constant `Connection: upgrade` isn't an option — it would break keep-alive on ordinary HTTP requests. Here the value is only substituted when the client actually sent an `Upgrade` header.

**Swagger.** The `proxy_pass` for `/api/docs` has **no** trailing slash, so the URI is preserved as-is. Swagger UI loads its assets by absolute paths under `/api/docs/`, and rewriting the prefix would break them.

## What's deliberately missing

**HSTS** — the header makes the browser stick to https for a long time. On an http-only site that would lock you out, so the line is left commented out: uncomment it together with TLS.

**Content-Security-Policy** — the right set of directives depends on which external resources the app uses. A wrong policy breaks pages silently, so no policy is set: tailor it per project.

**TLS** — there are no certificates; the proxy listens on plain HTTP. In most deployment scenarios (managed platforms, cloud load balancers, Kubernetes Ingress) TLS is terminated upstream and the proxy receives already-decrypted traffic. If you deploy to your own VPS, you'll need certbot — or a switch to Caddy with automatic HTTPS.

## Template and envsubst

`nginx.conf.tpl` is not a ready-made config. The `nginx:alpine` image's built-in entrypoint runs `*.template` files from `/etc/nginx/templates/` through `envsubst` and writes the result into `/etc/nginx/conf.d/` before nginx starts.

The pitfall: `envsubst` substitutes **every** `$variable`, including nginx's own `$uri`, `$host`, `$http_upgrade`. Those aren't set in the environment, so they'd become empty strings and break the config. A filter prevents that:

```dockerfile
ENV NGINX_ENVSUBST_FILTER='^(NGINX_INTERNAL_PORT|FRONTEND_INTERNAL_PORT|BACKEND_INTERNAL_PORT)$'
```

If you add a new variable to the template, list it here too — otherwise it stays in the config verbatim.

## Inspecting

View the final config after substitution:

```bash
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
```

Check the headers on a specific route:

```bash
curl -sI http://localhost/dev/docs/
```

Access and error logs:

```bash
docker compose logs nginx
```

## No proxy in dev mode

`pnpm dev` starts three processes on their own ports, without nginx. That's deliberate: Vite's HMR keeps a WebSocket connection open, and putting a proxy in front of it requires extra configuration (`server.hmr.clientPort`) that complicates the most common workflow for the sake of matching production.

The practical consequence is that addresses differ between dev and Docker, which is why they're kept in environment variables:

| What          | dev                               | Docker      |
| ------------- | --------------------------------- | ----------- |
| App           | `http://localhost:3200`           | `http://localhost/` |
| Documentation | `http://localhost:5173/dev/docs/` | `http://localhost/dev/docs/` |
| Swagger       | `http://localhost:3100/api/docs`  | `http://localhost/api/docs` |

The paths match, though — only the host and port differ. The documentation's `base` is hardcoded to `/dev/docs/` so those stay aligned too.
