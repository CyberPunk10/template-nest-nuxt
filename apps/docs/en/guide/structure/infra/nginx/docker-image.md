# infra/nginx

The only service that publishes a port to the outside. The image has no build of its own: it takes a ready `nginx:1.31-alpine` and puts two sets of files into it.

```dockerfile
COPY infra/nginx/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=docs /app/apps/docs/.vitepress/dist /srv/docs
```

The first is the config template: `envsubst` substitutes the variables into it when the container starts. The second is the documentation's static output, built by [apps/docs](../../apps/docs/docker-image).

Beyond routing, the proxy handles asset caching, security headers, gzip and WebSocket forwarding. The config walkthrough — [Reverse proxy](../../../reverse-proxy).

## Build and check

The image depends on `docs-builder`, so building it through compose is easier — compose supplies the build context itself:

```bash
docker compose build nginx
docker compose up -d nginx
```

To check that the proxy answers, use the built-in [HEALTHCHECK](../../../docker/dockerfiles#healthcheck):

```bash
docker inspect --format='{{json .State.Health}}' template-nest-nuxt-nginx-1
```

Compose derives the container name from the project name — see the exact one with `docker compose ps`.

To view the final config after variable substitution:

```bash
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
```
