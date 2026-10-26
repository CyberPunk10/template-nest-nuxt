# Единственная точка входа снаружи. Разбор конфига — apps/docs/guide/reverse-proxy.md
#
# Это шаблон, а не готовый конфиг: envsubst подставляет переменные при старте
# контейнера, но только перечисленные в NGINX_ENVSUBST_FILTER (см. Dockerfile).

# Константой Connection: upgrade прописать нельзя — сломает keep-alive
# на обычных запросах. map подставляет его только при апгрейде до WebSocket.
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen ${NGINX_INTERNAL_PORT};
    server_name _;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript application/xml image/svg+xml;
    gzip_min_length 1024;

    # Без Vary промежуточный кеш может отдать сжатый ответ клиенту без gzip.
    gzip_vary on;

    # Ответы апстримов тоже сжимаем: Nuxt и Nest отдают несжатое.
    gzip_proxied any;

    # Дефолтный лимит в 1 МБ мал для аплоадов.
    client_max_body_size 20m;

    server_tokens off;

    # Дефолт — 60s на каждый. SSR отвечает за десятки миллисекунд, поэтому
    # столько ждать незачем: при зависшем апстриме пользователь смотрит
    # в пустой экран, вместо того чтобы быстро получить 504.
    proxy_connect_timeout 5s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;

    # Дублируются во вложенных location: свой add_header отменяет наследование.
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # HSTS — только вместе с TLS, иначе закроет доступ к http-сайту.
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    #
    # CSP не задана намеренно — зависит от внешних ресурсов приложения.

    location /dev/docs/ {
        # alias, а не root: путь на диске не повторяет URL.
        alias /srv/docs/;

        # $uri.html — VitePress ссылается на страницы без расширения.
        # =404 обязателен: без него несуществующая страница отдаёт 200.
        try_files $uri $uri.html $uri/index.html =404;

        # Хеш в имени файла: изменилось содержимое — изменился и URL, поэтому
        # старый ответ из кеша устареть не может. Год безопасен ровно потому,
        # что HTML выше не кешируется и всегда приводит на свежие имена.
        location /dev/docs/assets/ {
            alias /srv/docs/assets/;

            # Одной директивой, а не expires + add_header: те дают два
            # заголовка Cache-Control и устаревший Expires из HTTP/1.0.
            add_header Cache-Control "public, immutable, max-age=31536000" always;
            add_header X-Content-Type-Options nosniff always;
            add_header X-Frame-Options SAMEORIGIN always;
            add_header Referrer-Policy strict-origin-when-cross-origin always;
        }

        error_page 404 /dev/docs/404.html;
    }

    # Без слэша не совпадёт с location выше и уедет в Nuxt, поэтому редиректим на верный URL.
    location = /dev/docs {
        return 301 /dev/docs/;
    }

    # Swagger UI. Путь совпадает с тем, что регистрирует Nest, а proxy_pass идёт
    # без завершающего слэша: Swagger грузит ассеты от /api/docs/, переписывать
    # префикс нельзя. Когда SWAGGER_ENABLED выключен — Nest отдаёт здесь 404.
    location /api/docs {
        proxy_pass http://backend:${BACKEND_INTERNAL_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Всё остальное, включая /api/backend/* — их форвардит в Nest сам Nuxt.
    # Порядок location не важен: nginx выбирает по длине совпадения префикса.
    location / {
        proxy_pass http://frontend:${FRONTEND_INTERNAL_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # Без этого за TLS-терминацией Nuxt сгенерирует http-ссылки.
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
