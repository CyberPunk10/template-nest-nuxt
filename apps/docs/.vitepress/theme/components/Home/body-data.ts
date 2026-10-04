import { repoUrl } from './site-data'

/** Адреса сервисов при `pnpm dev`. Порты — значения по умолчанию из .env.example. */
export const services = [
  { id: 'frontend', url: 'http://localhost:3200' },
  { id: 'backend', url: 'http://localhost:3100' },
  { id: 'swagger', url: 'http://localhost:3100/api/docs' },
  { id: 'health', url: 'http://localhost:3100/health' },
  { id: 'docs', url: 'http://localhost:5173/dev/docs/' },
] as const

/** Папки репозитория и страницы документации о них. */
export const projectMap = [
  { id: 'backend', path: 'apps/backend', doc: 'guide/structure/apps/backend/' },
  { id: 'prisma', path: 'apps/backend/prisma', doc: 'guide/database/prisma' },
  { id: 'frontend', path: 'apps/frontend', doc: 'guide/structure/apps/frontend/' },
  { id: 'docs', path: 'apps/docs', doc: 'guide/structure/apps/docs/' },
  { id: 'shared', path: 'packages/shared', doc: 'guide/structure/packages/shared/' },
  { id: 'ui', path: 'packages/ui', doc: 'guide/structure/packages/ui/' },
  { id: 'nginx', path: 'infra/nginx', doc: 'guide/structure/infra/nginx/' },
  { id: 'scripts', path: 'scripts', doc: 'guide/structure/scripts/' },
] as const

/** Разделы документации, куда стоит заглянуть после первого запуска. */
export const nextLinks = [
  { id: 'architecture', icon: 'layers', doc: 'guide/architecture' },
  { id: 'auth', icon: 'shield-check', doc: 'guide/auth/' },
  { id: 'database', icon: 'database', doc: 'guide/database/' },
  { id: 'env', icon: 'key-round', doc: 'guide/env-variables' },
  { id: 'testing', icon: 'check-circle', doc: 'guide/testing/' },
  { id: 'docker', icon: 'boxes', doc: 'guide/docker/' },
  { id: 'proxy', icon: 'network', doc: 'guide/reverse-proxy' },
] as const

/** Частые проблемы и страница, где разобрано подробнее. */
export const troubles = [
  { id: 'predev', doc: 'guide/structure/scripts/predev' },
  { id: 'port', doc: 'guide/getting-started/run-pnpm' },
  { id: 'stale', doc: 'guide/getting-started/run-docker' },
  { id: 'network', doc: 'guide/getting-started/run-docker' },
  { id: 'migrations', doc: 'guide/database/migrations' },
] as const

/** Генератор и шаблон, из которых создан проект. */
export const originLinks = [
  { id: 'generator', url: 'https://www.npmjs.com/package/create-nest-nuxt' },
  { id: 'template', url: repoUrl },
  { id: 'releases', url: `${repoUrl}/releases` },
] as const
