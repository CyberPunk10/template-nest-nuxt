import type { LocaleEntry } from '../config'
import locale from '../locales/ru.json'

// Русский язык — корневая локаль, страницы лежат в корне docs.
// Чтобы убрать язык из сборки: удалить этот файл и папку с его страницами.
const config: LocaleEntry = {
  // Ключ в locales: 'root' — язык по умолчанию, остальные дают префикс в URL.
  key: 'root',
  label: 'Русский',
  lang: 'ru',
  themeConfig: {
    outline: { level: 'deep' as const, label: 'На странице' },
    // Переводы стартовой страницы. Кладём в themeConfig — VitePress отдаёт
    // их через useData().theme, реактивно к локали. Заменяет vue-i18n.
    home: locale.home,
    sidebar: [
      {
        text: 'Документация проекта',
        items: [
          {
            text: 'Запуск проекта',
            link: '/guide/getting-started/',
            collapsed: false,
            items: [
              { text: 'Подготовка', link: '/guide/getting-started/setup' },
              { text: 'Через pnpm', link: '/guide/getting-started/run-pnpm' },
              { text: 'Через Docker', link: '/guide/getting-started/run-docker' },
            ],
          },
          {
            text: 'Структура проекта',
            link: '/guide/structure/',
            collapsed: true,
            items: [
              {
                text: 'apps',
                link: '/guide/structure/apps/',
                collapsed: true,
                items: [
                  {
                    text: 'backend',
                    link: '/guide/structure/apps/backend/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/guide/structure/apps/backend/docker-image' },
                      { text: '.env.example', link: '/guide/structure/apps/backend/env-example' },
                      { text: 'package.json', link: '/guide/structure/apps/backend/package-json' },
                      { text: 'tsconfig.json', link: '/guide/structure/apps/backend/tsconfig' },
                      { text: 'tsconfig.build.json', link: '/guide/structure/apps/backend/tsconfig-build' },
                    ],
                  },
                  {
                    text: 'frontend',
                    link: '/guide/structure/apps/frontend/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/guide/structure/apps/frontend/docker-image' },
                      { text: '.env.example', link: '/guide/structure/apps/frontend/env-example' },
                      { text: 'package.json', link: '/guide/structure/apps/frontend/package-json' },
                      { text: 'tsconfig.json', link: '/guide/structure/apps/frontend/tsconfig' },
                    ],
                  },
                  {
                    text: 'docs',
                    link: '/guide/structure/apps/docs/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/guide/structure/apps/docs/docker-image' },
                      { text: '.env.example', link: '/guide/structure/apps/docs/env-example' },
                      { text: 'package.json', link: '/guide/structure/apps/docs/package-json' },
                      { text: 'tsconfig.json', link: '/guide/structure/apps/docs/tsconfig' },
                    ],
                  },
                ],
              },
              {
                text: 'packages',
                link: '/guide/structure/packages/',
                collapsed: true,
                items: [
                  {
                    text: 'shared',
                    link: '/guide/structure/packages/shared/',
                    collapsed: true,
                    items: [
                      { text: 'package.json', link: '/guide/structure/packages/shared/package-json' },
                      { text: 'tsconfig.json', link: '/guide/structure/packages/shared/tsconfig' },
                    ],
                  },
                  {
                    text: 'ui',
                    link: '/guide/structure/packages/ui/',
                    collapsed: true,
                    items: [
                      { text: 'package.json', link: '/guide/structure/packages/ui/package-json' },
                      { text: 'tsconfig.json', link: '/guide/structure/packages/ui/tsconfig' },
                    ],
                  },
                ],
              },
              {
                text: 'infra',
                link: '/guide/structure/infra/',
                collapsed: true,
                items: [
                  {
                    text: 'nginx',
                    link: '/guide/structure/infra/nginx/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/guide/structure/infra/nginx/docker-image' },
                    ],
                  },
                ],
              },
              {
                text: 'scripts',
                link: '/guide/structure/scripts/',
                collapsed: true,
                items: [
                  { text: 'predev.mjs', link: '/guide/structure/scripts/predev' },
                  { text: 'predocker.mjs', link: '/guide/structure/scripts/predocker' },
                  { text: 'copy-env.mjs', link: '/guide/structure/scripts/copy-env' },
                  { text: 'copy-env-cli.mjs', link: '/guide/structure/scripts/copy-env-cli' },
                  { text: 'check-ports.mjs', link: '/guide/structure/scripts/check-ports' },
                  { text: 'ensure-network.mjs', link: '/guide/structure/scripts/ensure-network' },
                  { text: 'log.mjs', link: '/guide/structure/scripts/log' },
                  { text: 'dev.mjs', link: '/guide/structure/scripts/dev' },
                  { text: 'reinstall.mjs', link: '/guide/structure/scripts/reinstall' },
                ],
              },
              { text: '.husky', link: '/guide/structure/husky/' },
              { text: 'docker-compose.yml', link: '/guide/structure/docker-compose' },
              { text: 'tsconfig.base.json', link: '/guide/structure/tsconfig-base' },
              { text: '.env.example', link: '/guide/structure/env-example' },
              { text: 'package.json', link: '/guide/structure/package-json' },
            ],
          },
          { text: 'Архитектура', link: '/guide/architecture' },
          { text: 'Переменные окружения', link: '/guide/env-variables' },
          {
            text: 'Docker',
            link: '/guide/docker/',
            collapsed: true,
            items: [
              { text: 'Dockerfile', link: '/guide/docker/dockerfiles' },
            ],
          },
          { text: 'Reverse proxy', link: '/guide/reverse-proxy' },
          {
            text: 'Тестирование',
            link: '/guide/testing/',
            collapsed: true,
            items: [
              { text: 'Тесты backend', link: '/guide/testing/backend' },
            ],
          },
        ],
      },
      {
        text: 'Дополнительная информация',
        items: [
          { text: 'pnpm и Corepack', link: '/guide/pnpm' },
        ],
      },
    ],
    docFooter: {
      prev: 'Предыдущая страница',
      next: 'Следующая страница',
    },
    returnToTopLabel: 'Наверх',
    darkModeSwitchLabel: 'Тема',
    sidebarMenuLabel: 'Меню',
  },
}

export default config
