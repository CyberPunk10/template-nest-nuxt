FROM node:24.22-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @repo/frontend build

# ---- production image ----
FROM node:24.22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3200
USER node
COPY --from=builder --chown=node:node /app/apps/frontend/.output ./.output
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["node", ".output/server/index.mjs"]
