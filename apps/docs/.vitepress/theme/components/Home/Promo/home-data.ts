import { repoUrl } from '../site-data'

export const authorUrl = 'https://github.com/CyberPunk10'

/**
 * Разбор схемы авторизации. Живёт не в этой сборке доков: страницы
 * guide/auth/ есть только там, где авторизация реализована, — поэтому
 * ссылка ведёт в репозиторий, а не внутрь сайта.
 */
export const authDocsUrl = `${repoUrl}/blob/auth-session/apps/docs/guide/auth/index.md`

/** Страница спонсорства. TODO: — аккаунт GitHub Sponsors не подключён. */
export const sponsorUrl = 'https://github.com/sponsors/CyberPunk10'

/** Контакты для связи. TODO: — вписать реальные или убрать из футера. */
export const contacts = {
  email: 'you@example.com',
  telegram: 'https://t.me/your_handle',
}

export interface CryptoWallet {
  label: string
  address: string
}

/**
 * Кошельки для донатов. TODO: — вписать реальные или убрать лишние сети.
 *
 * Сеть в label указана намеренно: отправка USDT не в ту сеть теряет перевод.
 * BEP20 (BNB Smart Chain) EVM-совместима, поэтому адрес в том же формате, что ETH.
 */
export const cryptoWallets: CryptoWallet[] = [
  { label: 'USDT (BEP20)', address: '0xExampleExampleExampleExampleExample1111' },
  { label: 'USDT (TRC20)', address: 'TExampleExampleExampleExampleExample00' },
  { label: 'BTC', address: 'bc1qexampleexampleexampleexampleexampl0000' },
  { label: 'ETH', address: '0xExampleExampleExampleExampleExample0000' },
]

/**
 * Спонсоры проекта. Пока пусто — секция показывает свободные слоты.
 * Появятся реальные: { name, logoUrl, url } и рендер логотипов вместо заглушек.
 */
export const sponsors: never[] = []

/** Сколько свободных слотов показывать в секции спонсоров. */
export const freeSponsorSlots = 3

// Имя папки проекта в примерах быстрого старта
const projectDir = 'my-app'

export interface Branch {
  id: string // ключ в home.promo.branches (main | auth | postgresPrisma)
  name: string
}

export interface QuickstartStep {
  id: string // ключ в home.promo.quickstart.steps
  cmd: string
}

export interface Principle {
  id: string // ключ в home.promo.principles
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
  id: string // ключ в home.promo.auth.points
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
  id: string // ключ в home.promo.fit.cases
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
