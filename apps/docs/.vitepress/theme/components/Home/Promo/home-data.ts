// Имя папки проекта в примерах быстрого старта
const projectDir = 'my-app'

export interface Branch {
  id: string // ключ в home.branches (main | auth | postgresPrisma)
  name: string
}

export interface QuickstartStep {
  id: string // ключ в home.quickstart.steps
  cmd: string
}

export interface Principle {
  id: string // ключ в home.principles
  icon: string
}

export const branches: Branch[] = [
  {
    id: 'main',
    name: 'main',
  },
  {
    id: 'auth',
    name: 'auth-session',
  },
  {
    id: 'postgresPrisma',
    name: 'postgres-prisma',
  },
]

export const quickstartSteps: QuickstartStep[] = [
  { id: 'create', cmd: `npx create-nest-nuxt ${projectDir}` },
  { id: 'install', cmd: `cd ${projectDir} && pnpm install` },
  { id: 'run', cmd: 'pnpm dev' },
]

export const principles: Principle[] = [
  { id: 'transparency', icon: 'lucide:eye' },
  { id: 'idiomatic', icon: 'lucide:book-open' },
  { id: 'production', icon: 'lucide:zap' },
  { id: 'starter', icon: 'lucide:rocket' },
]

// ─────────────────────  Витрина стека (логотипы)  ─────────────────────

export interface StackLogo {
  id: string
  color: string
  // Документация именно той версии, что стоит в шаблоне, если у технологии
  // она версионируется: по умолчанию сайты показывают последнюю.
  url: string
  optional?: true
}

/**
 * Порядок намеренный: сначала два фреймворка-героя (Nest, Nuxt), затем язык
 * и рантайм-слой, потом инфраструктура — и только в конце опциональные
 * модули. Так шесть карточек базового шаблона читаются как один сплошной
 * блок, а расширения не разрывают его посередине. Логотипы рисует
 * TechLogo.vue (inline-SVG, без внешних CDN — доки собираются в статику
 * и раздаются nginx).
 */
export const stackLogos: StackLogo[] = [
  { id: 'nest', color: '#e0234e', url: 'https://docs.nestjs.com/' },
  { id: 'nuxt', color: '#00dc82', url: 'https://nuxt.com/docs/4.x/getting-started/introduction' },
  { id: 'vue', color: '#42b883', url: 'https://vuejs.org/guide/introduction' },
  { id: 'typescript', color: '#3178c6', url: 'https://www.typescriptlang.org/docs/' },
  { id: 'docker', color: '#2496ed', url: 'https://docs.docker.com/' },
  { id: 'pnpm', color: '#f9ad00', url: 'https://pnpm.io/motivation' },
  { id: 'prisma', color: '#5a67d8', url: 'https://www.prisma.io/docs/orm/v7', optional: true },
  { id: 'postgres', color: '#4169e1', url: 'https://www.postgresql.org/docs/17/', optional: true },
]

// ──────────────────────────  Авторизация  ──────────────────────────

export interface AuthPoint {
  id: string // ключ в home.auth.points
  icon: string
}

/** Тезисы о реализации авторизации: от схемы токенов к защите и ролям. */
export const authPoints: AuthPoint[] = [
  { id: 'tokens', icon: 'lucide:key-round' },
  { id: 'cookies', icon: 'lucide:cookie' },
  { id: 'rotation', icon: 'lucide:refresh-cw' },
  { id: 'sessions', icon: 'lucide:monitor-smartphone' },
  { id: 'roles', icon: 'lucide:shield-check' },
  { id: 'ssr', icon: 'lucide:server' },
  { id: 'providers', icon: 'lucide:puzzle' },
]

// ────────────────────  Кому подходит / не подходит  ────────────────────

export type FitVerdict = 'good' | 'bad' | 'mixed'

export interface FitCase {
  id: string // ключ в home.fit.cases
  verdict: FitVerdict
  icon: string
}

/**
 * Честный разбор применимости шаблона. Смешанный порядок (не все «за», потом
 * все «против») — намеренно: так секция читается как разбор, а не как реклама
 * с дисклеймером в конце.
 */
export const fitCases: FitCase[] = [
  { id: 'saas', verdict: 'good', icon: 'lucide:layout-dashboard' },
  { id: 'admin', verdict: 'good', icon: 'lucide:table' },
  { id: 'landing', verdict: 'bad', icon: 'lucide:megaphone' },
  { id: 'mobileBackend', verdict: 'good', icon: 'lucide:smartphone' },
  { id: 'contentSite', verdict: 'bad', icon: 'lucide:newspaper' },
  { id: 'mvp', verdict: 'good', icon: 'lucide:rocket' },
  { id: 'microservices', verdict: 'mixed', icon: 'lucide:boxes' },
  { id: 'serverless', verdict: 'bad', icon: 'lucide:cloud-off' },
  { id: 'learning', verdict: 'good', icon: 'lucide:graduation-cap' },
  { id: 'highLoad', verdict: 'mixed', icon: 'lucide:gauge' },
  { id: 'legacy', verdict: 'mixed', icon: 'lucide:network' },
  { id: 'internalTools', verdict: 'good', icon: 'lucide:wrench' },
]
