export const layers = ['Backend', 'Frontend', 'Shared', 'Infra'] as const
export type Layer = (typeof layers)[number]

export interface Branch {
  name: string
  labelKey: string
  current: boolean
  descKey: string
  stack: Record<Layer, string[]>
}

export interface QuickstartStep {
  labelKey: string
  cmd: string
}

export interface Quickstart {
  branch: string
  steps: QuickstartStep[]
}

export interface Principle {
  icon: string
  titleKey: string
  descKey: string
}

export const branches: Branch[] = [
  {
    name: 'main',
    labelKey: 'about.branches.main.label',
    current: false,
    descKey: 'about.branches.main.desc',
    stack: {
      Backend: ['NestJS', 'Joi validation', 'Swagger/OpenAPI', 'Exception filter'],
      Frontend: ['Nuxt 4', 'Vue 3', 'TypeScript'],
      Shared: ['@repo/shared', 'i18n (ru/en/th)'],
      Infra: ['Docker (multi-stage)', 'pnpm 11 workspaces'],
    },
  },
  {
    name: 'postgres-prisma',
    labelKey: 'about.branches.postgresPrisma.label',
    current: false,
    descKey: 'about.branches.postgresPrisma.desc',
    stack: {
      Backend: ['NestJS', 'Prisma 7', '@prisma/adapter-pg', 'Joi validation', 'Swagger/OpenAPI'],
      Frontend: ['Nuxt 4', 'Vue 3', 'TypeScript'],
      Shared: ['@repo/shared', 'i18n (ru/en/th)'],
      Infra: ['Docker (multi-stage)', 'pnpm 11 workspaces', 'PostgreSQL 17'],
    },
  },
  {
    name: 'auth',
    labelKey: 'about.branches.auth.label',
    current: true,
    descKey: 'about.branches.auth.desc',
    stack: {
      Backend: [
        'NestJS',
        'Prisma 7',
        '@prisma/adapter-pg',
        'Passport.js',
        'JWT + bcrypt',
        'Swagger/OpenAPI',
      ],
      Frontend: ['Nuxt 4', 'Vue 3', 'TypeScript', 'useAuth', 'Route middleware'],
      Shared: ['@repo/shared', 'i18n (ru/en/th)'],
      Infra: ['Docker (multi-stage)', 'pnpm 11 workspaces', 'PostgreSQL 17'],
    },
  },
]

export const quickstarts: Quickstart[] = [
  {
    branch: 'main',
    steps: [
      {
        labelKey: 'about.quickstart.steps.clone',
        cmd: 'git clone https://github.com/CyberPunk10/template-nest-nuxt-docker && git checkout main',
      },
      { labelKey: 'about.quickstart.steps.install', cmd: 'pnpm install' },
      { labelKey: 'about.quickstart.steps.run', cmd: 'pnpm dev' },
    ],
  },
  {
    branch: 'postgres-prisma',
    steps: [
      {
        labelKey: 'about.quickstart.steps.clone',
        cmd: 'git clone https://github.com/CyberPunk10/template-nest-nuxt-docker && git checkout postgres-prisma',
      },
      { labelKey: 'about.quickstart.steps.install', cmd: 'pnpm install' },
      {
        labelKey: 'about.quickstart.steps.envCheck',
        cmd: 'cp apps/backend/.env.example apps/backend/.env',
      },
      {
        labelKey: 'about.quickstart.steps.network',
        cmd: 'docker network create template-nest-nuxt_app',
      },
      {
        labelKey: 'about.quickstart.steps.postgres',
        cmd: 'docker compose -f docker-compose.dev.yml up -d',
      },
      {
        labelKey: 'about.quickstart.steps.migrate',
        cmd: 'cd apps/backend && pnpm prisma migrate dev',
      },
      { labelKey: 'about.quickstart.steps.run', cmd: 'pnpm dev' },
    ],
  },
  {
    branch: 'auth',
    steps: [
      {
        labelKey: 'about.quickstart.steps.clone',
        cmd: 'git clone https://github.com/CyberPunk10/template-nest-nuxt-docker && git checkout auth',
      },
      { labelKey: 'about.quickstart.steps.install', cmd: 'pnpm install' },
      {
        labelKey: 'about.quickstart.steps.envCheck',
        cmd: 'cp apps/backend/.env.example apps/backend/.env',
      },
      {
        labelKey: 'about.quickstart.steps.network',
        cmd: 'docker network create template-nest-nuxt_app',
      },
      {
        labelKey: 'about.quickstart.steps.postgres',
        cmd: 'docker compose -f docker-compose.dev.yml up -d',
      },
      {
        labelKey: 'about.quickstart.steps.migrate',
        cmd: 'cd apps/backend && pnpm prisma migrate dev',
      },
      { labelKey: 'about.quickstart.steps.run', cmd: 'pnpm dev' },
    ],
  },
]

export const principles: Principle[] = [
  {
    icon: 'lucide:eye',
    titleKey: 'about.principles.transparency.title',
    descKey: 'about.principles.transparency.desc',
  },
  {
    icon: 'lucide:book-open',
    titleKey: 'about.principles.idiomatic.title',
    descKey: 'about.principles.idiomatic.desc',
  },
  {
    icon: 'lucide:zap',
    titleKey: 'about.principles.production.title',
    descKey: 'about.principles.production.desc',
  },
  {
    icon: 'lucide:puzzle',
    titleKey: 'about.principles.monorepo.title',
    descKey: 'about.principles.monorepo.desc',
  },
]
