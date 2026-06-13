FROM node:24-alpine AS base
RUN npm install -g pnpm@11.5.2

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @repo/backend build
RUN pnpm --filter @repo/backend deploy --prod --legacy /deploy

# ---- production image ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
