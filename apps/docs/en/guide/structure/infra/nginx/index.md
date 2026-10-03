# infra/nginx

The reverse proxy — the only service that publishes a port to the outside.

```
infra/nginx/
├── nginx.conf.template     config template: routes, headers, gzip
└── Dockerfile              nginx plus the built documentation
```

## Why a template rather than a plain conf

The `.template` extension is a convention of the official nginx image: files in `/etc/nginx/templates/` are passed through `envsubst` when the container starts, and `${BACKEND_INTERNAL_PORT}` is replaced with the real value.

Not every variable gets substituted: the Dockerfile sets `NGINX_ENVSUBST_FILTER` with an allow-list. Without it `envsubst` would also touch nginx's own variables (`$host`, `$uri`, `$http_upgrade`) and turn them into empty strings.

## The documentation inside the image

The Dockerfile copies VitePress's built output from the `docs-builder` image into `/srv/docs`. There is no separate documentation container — nginx serves it from disk.

Route breakdown — [Reverse proxy](../../../reverse-proxy), image build — [Dockerfile](./docker-image).
