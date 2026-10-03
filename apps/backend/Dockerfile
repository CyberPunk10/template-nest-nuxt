FROM node:24.18-alpine AS base
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
# Клиент Prisma генерирует postinstall backend'а во время install, поэтому
# схема и конфиг нужны до него. Клиент с хоста в образ не копируется
# (src/generated в .dockerignore) — образ всегда строит свой.
COPY apps/backend/prisma/schema.prisma ./apps/backend/prisma/
COPY apps/backend/prisma.config.ts ./apps/backend/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @repo/backend build
RUN pnpm --filter @repo/backend deploy --prod --legacy /deploy

# ---- production image ----
FROM node:24.18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100
USER node
COPY --from=builder --chown=node:node /deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend/dist ./dist
# prisma/ и prisma.config.ts нужны в рантайме: entrypoint применяет миграции
# через `prisma migrate deploy`, которому требуются схема и файлы миграций.
COPY --from=builder --chown=node:node /app/apps/backend/prisma ./prisma
COPY --from=builder --chown=node:node /app/apps/backend/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node apps/backend/docker-entrypoint.sh ./docker-entrypoint.sh
EXPOSE ${PORT}
HEALTHCHECK --interval=5s --timeout=3s --start-period=60s \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
