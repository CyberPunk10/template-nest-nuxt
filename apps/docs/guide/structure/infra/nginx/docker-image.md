# infra/nginx

Единственный сервис, публикующий порт наружу. Собственной сборки у образа нет: берёт готовый `nginx:1.31-alpine` и кладёт в него два набора файлов.

```dockerfile
COPY infra/nginx/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=docs /app/apps/docs/.vitepress/dist /srv/docs
```

Первый — шаблон конфига: `envsubst` подставит в него переменные при старте контейнера. Второй — статика документации, которую собрал [apps/docs](../../apps/docs/docker-image).

Помимо маршрутизации прокси отвечает за кеширование ассетов, заголовки безопасности, gzip и проброс WebSocket. Разбор конфига — [Reverse proxy](../../../reverse-proxy).

## Собрать и проверить

Образ зависит от `docs-builder`, поэтому собирать его удобнее через compose — тот сам подставит build-контекст:

```bash
docker compose build nginx
docker compose up -d nginx
```

Проверить, что прокси отвечает, — через встроенный [HEALTHCHECK](../../../docker/dockerfiles#healthcheck):

```bash
docker inspect --format='{{json .State.Health}}' template-nest-nuxt-nginx-1
```

Имя контейнера Compose составляет из названия проекта — посмотреть точное можно через `docker compose ps`.

Посмотреть итоговый конфиг после подстановки переменных:

```bash
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
```
