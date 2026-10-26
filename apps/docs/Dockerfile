FROM node:24.18-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/docs/package.json ./apps/docs/
RUN pnpm install --frozen-lockfile

COPY . .

# Адрес кнопки «Перейти в кабинет». Вшивается в сборку: доки статические,
# рантайм-конфига у них нет. За прокси фронтенд доступен по '/' того же домена.
ENV DASHBOARD_URL=/

RUN pnpm --filter @repo/docs build
