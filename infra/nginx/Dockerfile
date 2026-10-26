FROM nginx:1.31-alpine

ENV NGINX_INTERNAL_PORT=80

# Без фильтра envsubst подставил бы и nginx-овские $host/$uri/$http_upgrade,
# превратив их в пустые строки. Новую переменную шаблона добавлять сюда.
ENV NGINX_ENVSUBST_FILTER='^(NGINX_INTERNAL_PORT|FRONTEND_INTERNAL_PORT|BACKEND_INTERNAL_PORT)$'

COPY infra/nginx/nginx.conf.tpl /etc/nginx/templates/default.conf.template

# Контекст `docs` — образ docs-builder, см. additional_contexts в docker-compose.yml
COPY --from=docs /app/apps/docs/.vitepress/dist /srv/docs

EXPOSE ${NGINX_INTERNAL_PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:${NGINX_INTERNAL_PORT}/ || exit 1
