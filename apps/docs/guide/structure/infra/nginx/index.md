# infra/nginx

Reverse proxy — единственный сервис, публикующий порт наружу.

```
infra/nginx/
├── nginx.conf.template     шаблон конфига: маршруты, заголовки, gzip
└── Dockerfile              nginx + собранная документация
```

## Почему template, а не conf

Расширение `.template` — соглашение официального образа nginx: файлы из `/etc/nginx/templates/` проходят через `envsubst` при старте контейнера, и `${BACKEND_INTERNAL_PORT}` заменяется реальным значением.

Подставляются не все переменные подряд: в Dockerfile задан `NGINX_ENVSUBST_FILTER` со списком разрешённых. Без него `envsubst` затронул бы и переменные самого nginx (`$host`, `$uri`, `$http_upgrade`), превратив их в пустые строки.

## Документация внутри образа

Dockerfile копирует собранную статику VitePress из образа `docs-builder` и кладёт в `/srv/docs`. Отдельного контейнера с документацией нет — nginx отдаёт её с диска.

Разбор маршрутов — [Reverse proxy](../../../reverse-proxy), сборка образа — [infra/nginx](./docker-image) в разделе Docker.
