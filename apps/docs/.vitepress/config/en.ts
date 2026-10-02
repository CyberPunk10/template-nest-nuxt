import type { LocaleEntry } from '../config'
import locale from '../locales/en.json'

// Английская локаль: страницы в en/, ссылки с префиксом /en/.
// Чтобы убрать язык из сборки: удалить этот файл и папку en/.
const config: LocaleEntry = {
  // Ключ в locales: 'root' — язык по умолчанию, остальные дают префикс в URL.
  key: 'en',
  label: 'English',
  lang: 'en',
  themeConfig: {
    outline: { level: 'deep' as const, label: 'On this page' },
    home: locale.home,
    sidebar: [
      {
        text: 'Documentation',
        items: [
          {
            text: 'Getting started',
            link: '/en/guide/getting-started/',
            collapsed: false,
            items: [
              { text: 'Setup', link: '/en/guide/getting-started/setup' },
              { text: 'With pnpm', link: '/en/guide/getting-started/run-pnpm' },
              { text: 'With Docker', link: '/en/guide/getting-started/run-docker' },
            ],
          },
          {
            text: 'Project structure',
            link: '/en/guide/structure/',
            collapsed: true,
            items: [
              {
                text: 'apps',
                link: '/en/guide/structure/apps/',
                collapsed: true,
                items: [
                  {
                    text: 'backend',
                    link: '/en/guide/structure/apps/backend/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/en/guide/structure/apps/backend/docker-image' },
                      { text: '.env.example', link: '/en/guide/structure/apps/backend/env-example' },
                      { text: 'package.json', link: '/en/guide/structure/apps/backend/package-json' },
                      { text: 'tsconfig.json', link: '/en/guide/structure/apps/backend/tsconfig' },
                      { text: 'tsconfig.build.json', link: '/en/guide/structure/apps/backend/tsconfig-build' },
                      { text: 'prisma', link: '/en/guide/structure/apps/backend/prisma/' },
                    ],
                  },
                  {
                    text: 'frontend',
                    link: '/en/guide/structure/apps/frontend/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/en/guide/structure/apps/frontend/docker-image' },
                      { text: '.env.example', link: '/en/guide/structure/apps/frontend/env-example' },
                      { text: 'package.json', link: '/en/guide/structure/apps/frontend/package-json' },
                      { text: 'tsconfig.json', link: '/en/guide/structure/apps/frontend/tsconfig' },
                    ],
                  },
                  {
                    text: 'docs',
                    link: '/en/guide/structure/apps/docs/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/en/guide/structure/apps/docs/docker-image' },
                      { text: '.env.example', link: '/en/guide/structure/apps/docs/env-example' },
                      { text: 'package.json', link: '/en/guide/structure/apps/docs/package-json' },
                      { text: 'tsconfig.json', link: '/en/guide/structure/apps/docs/tsconfig' },
                    ],
                  },
                ],
              },
              {
                text: 'packages',
                link: '/en/guide/structure/packages/',
                collapsed: true,
                items: [
                  {
                    text: 'shared',
                    link: '/en/guide/structure/packages/shared/',
                    collapsed: true,
                    items: [
                      { text: 'package.json', link: '/en/guide/structure/packages/shared/package-json' },
                      { text: 'tsconfig.json', link: '/en/guide/structure/packages/shared/tsconfig' },
                    ],
                  },
                  {
                    text: 'ui',
                    link: '/en/guide/structure/packages/ui/',
                    collapsed: true,
                    items: [
                      { text: 'package.json', link: '/en/guide/structure/packages/ui/package-json' },
                      { text: 'tsconfig.json', link: '/en/guide/structure/packages/ui/tsconfig' },
                    ],
                  },
                ],
              },
              {
                text: 'infra',
                link: '/en/guide/structure/infra/',
                collapsed: true,
                items: [
                  {
                    text: 'nginx',
                    link: '/en/guide/structure/infra/nginx/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/en/guide/structure/infra/nginx/docker-image' },
                    ],
                  },
                ],
              },
              {
                text: 'scripts',
                link: '/en/guide/structure/scripts/',
                collapsed: true,
                items: [
                  { text: 'predev.mjs', link: '/en/guide/structure/scripts/predev' },
                  { text: 'predocker.mjs', link: '/en/guide/structure/scripts/predocker' },
                  { text: 'copy-env.mjs', link: '/en/guide/structure/scripts/copy-env' },
                  { text: 'copy-env-cli.mjs', link: '/en/guide/structure/scripts/copy-env-cli' },
                  { text: 'check-ports.mjs', link: '/en/guide/structure/scripts/check-ports' },
                  { text: 'ensure-network.mjs', link: '/en/guide/structure/scripts/ensure-network' },
                  { text: 'log.mjs', link: '/en/guide/structure/scripts/log' },
                  { text: 'db.mjs', link: '/en/guide/structure/scripts/db' },
                  { text: 'dev.mjs', link: '/en/guide/structure/scripts/dev' },
                  { text: 'reinstall.mjs', link: '/en/guide/structure/scripts/reinstall' },
                ],
              },
              { text: '.husky', link: '/en/guide/structure/husky/' },
              { text: 'docker-compose.yml', link: '/en/guide/structure/docker-compose' },
              { text: 'tsconfig.base.json', link: '/en/guide/structure/tsconfig-base' },
              { text: '.env.example', link: '/en/guide/structure/env-example' },
              { text: 'package.json', link: '/en/guide/structure/package-json' },
            ],
          },
          { text: 'Architecture', link: '/en/guide/architecture' },
          { text: 'Environment variables', link: '/en/guide/env-variables' },
          {
            text: 'Docker',
            link: '/en/guide/docker/',
            collapsed: true,
            items: [
              { text: 'Dockerfile', link: '/en/guide/docker/dockerfiles' },
            ],
          },
          { text: 'Reverse proxy', link: '/en/guide/reverse-proxy' },
          {
            text: 'Testing',
            link: '/en/guide/testing/',
            collapsed: true,
            items: [
              { text: 'Backend tests', link: '/en/guide/testing/backend' },
            ],
          },
          {
            text: 'Authentication',
            link: '/en/guide/auth/',
            collapsed: true,
            items: [
              { text: 'Backend', link: '/en/guide/auth/backend' },
              { text: 'Frontend', link: '/en/guide/auth/frontend' },
            ],
          },
          {
            text: 'Database',
            link: '/en/guide/database/',
            collapsed: true,
            items: [
              { text: 'Configuration', link: '/en/guide/database/configuration' },
              { text: 'Prisma: schema and client', link: '/en/guide/database/prisma' },
              { text: 'Migrations', link: '/en/guide/database/migrations' },
              { text: 'Prisma errors', link: '/en/guide/database/errors' },
            ],
          },
        ],
      },
      {
        text: 'Additional Information',
        items: [
          { text: 'pnpm and Corepack', link: '/en/guide/pnpm' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/en/markdown-examples' },
          { text: 'Runtime API Examples', link: '/en/api-examples' },
        ],
      },
    ],
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },
    returnToTopLabel: 'Return to top',
    darkModeSwitchLabel: 'Appearance',
    sidebarMenuLabel: 'Menu',
  },
}

export default config
