FROM node:24-alpine AS base
RUN npm install -g pnpm@11.5.2

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
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/frontend/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
