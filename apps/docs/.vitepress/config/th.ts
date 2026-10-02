import type { LocaleEntry } from '../config'
import locale from '../locales/th.json'

// Тайская локаль: страницы в th/, ссылки с префиксом /th/.
// Чтобы убрать язык из сборки: удалить этот файл и папку th/.
const config: LocaleEntry = {
  // Ключ в locales: 'root' — язык по умолчанию, остальные дают префикс в URL.
  key: 'th',
  label: 'ไทย',
  lang: 'th',
  themeConfig: {
    outline: { level: 'deep' as const, label: 'ในหน้านี้' },
    home: locale.home,
    sidebar: [
      {
        text: 'เอกสาร',
        items: [
          {
            text: 'เริ่มต้นใช้งาน',
            link: '/th/guide/getting-started/',
            collapsed: false,
            items: [
              { text: 'การเตรียมความพร้อม', link: '/th/guide/getting-started/setup' },
              { text: 'ด้วย pnpm', link: '/th/guide/getting-started/run-pnpm' },
              { text: 'ด้วย Docker', link: '/th/guide/getting-started/run-docker' },
            ],
          },
          {
            text: 'โครงสร้างโปรเจกต์',
            link: '/th/guide/structure/',
            collapsed: true,
            items: [
              {
                text: 'apps',
                link: '/th/guide/structure/apps/',
                collapsed: true,
                items: [
                  {
                    text: 'backend',
                    link: '/th/guide/structure/apps/backend/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/th/guide/structure/apps/backend/docker-image' },
                      { text: '.env.example', link: '/th/guide/structure/apps/backend/env-example' },
                      { text: 'package.json', link: '/th/guide/structure/apps/backend/package-json' },
                      { text: 'tsconfig.json', link: '/th/guide/structure/apps/backend/tsconfig' },
                      { text: 'tsconfig.build.json', link: '/th/guide/structure/apps/backend/tsconfig-build' },
                      { text: 'prisma', link: '/th/guide/structure/apps/backend/prisma/' },
                    ],
                  },
                  {
                    text: 'frontend',
                    link: '/th/guide/structure/apps/frontend/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/th/guide/structure/apps/frontend/docker-image' },
                      { text: '.env.example', link: '/th/guide/structure/apps/frontend/env-example' },
                      { text: 'package.json', link: '/th/guide/structure/apps/frontend/package-json' },
                      { text: 'tsconfig.json', link: '/th/guide/structure/apps/frontend/tsconfig' },
                    ],
                  },
                  {
                    text: 'docs',
                    link: '/th/guide/structure/apps/docs/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/th/guide/structure/apps/docs/docker-image' },
                      { text: '.env.example', link: '/th/guide/structure/apps/docs/env-example' },
                      { text: 'package.json', link: '/th/guide/structure/apps/docs/package-json' },
                      { text: 'tsconfig.json', link: '/th/guide/structure/apps/docs/tsconfig' },
                    ],
                  },
                ],
              },
              {
                text: 'packages',
                link: '/th/guide/structure/packages/',
                collapsed: true,
                items: [
                  {
                    text: 'shared',
                    link: '/th/guide/structure/packages/shared/',
                    collapsed: true,
                    items: [
                      { text: 'package.json', link: '/th/guide/structure/packages/shared/package-json' },
                      { text: 'tsconfig.json', link: '/th/guide/structure/packages/shared/tsconfig' },
                    ],
                  },
                  {
                    text: 'ui',
                    link: '/th/guide/structure/packages/ui/',
                    collapsed: true,
                    items: [
                      { text: 'package.json', link: '/th/guide/structure/packages/ui/package-json' },
                      { text: 'tsconfig.json', link: '/th/guide/structure/packages/ui/tsconfig' },
                    ],
                  },
                ],
              },
              {
                text: 'infra',
                link: '/th/guide/structure/infra/',
                collapsed: true,
                items: [
                  {
                    text: 'nginx',
                    link: '/th/guide/structure/infra/nginx/',
                    collapsed: true,
                    items: [
                      { text: 'Dockerfile', link: '/th/guide/structure/infra/nginx/docker-image' },
                    ],
                  },
                ],
              },
              {
                text: 'scripts',
                link: '/th/guide/structure/scripts/',
                collapsed: true,
                items: [
                  { text: 'predev.mjs', link: '/th/guide/structure/scripts/predev' },
                  { text: 'predocker.mjs', link: '/th/guide/structure/scripts/predocker' },
                  { text: 'copy-env.mjs', link: '/th/guide/structure/scripts/copy-env' },
                  { text: 'copy-env-cli.mjs', link: '/th/guide/structure/scripts/copy-env-cli' },
                  { text: 'check-ports.mjs', link: '/th/guide/structure/scripts/check-ports' },
                  { text: 'ensure-network.mjs', link: '/th/guide/structure/scripts/ensure-network' },
                  { text: 'log.mjs', link: '/th/guide/structure/scripts/log' },
                  { text: 'db.mjs', link: '/th/guide/structure/scripts/db' },
                  { text: 'dev.mjs', link: '/th/guide/structure/scripts/dev' },
                  { text: 'reinstall.mjs', link: '/th/guide/structure/scripts/reinstall' },
                ],
              },
              { text: '.husky', link: '/th/guide/structure/husky/' },
              { text: 'docker-compose.yml', link: '/th/guide/structure/docker-compose' },
              { text: 'tsconfig.base.json', link: '/th/guide/structure/tsconfig-base' },
              { text: '.env.example', link: '/th/guide/structure/env-example' },
              { text: 'package.json', link: '/th/guide/structure/package-json' },
            ],
          },
          { text: 'สถาปัตยกรรม', link: '/th/guide/architecture' },
          { text: 'ตัวแปรสภาพแวดล้อม', link: '/th/guide/env-variables' },
          {
            text: 'Docker',
            link: '/th/guide/docker/',
            collapsed: true,
            items: [
              { text: 'Dockerfile', link: '/th/guide/docker/dockerfiles' },
            ],
          },
          { text: 'Reverse proxy', link: '/th/guide/reverse-proxy' },
          {
            text: 'การทดสอบ',
            link: '/th/guide/testing/',
            collapsed: true,
            items: [
              { text: 'การทดสอบ backend', link: '/th/guide/testing/backend' },
            ],
          },
          {
            text: 'การยืนยันตัวตน',
            link: '/th/guide/auth/',
            collapsed: true,
            items: [
              { text: 'Backend', link: '/th/guide/auth/backend' },
              { text: 'Frontend', link: '/th/guide/auth/frontend' },
            ],
          },
          { text: 'ฐานข้อมูล', link: '/th/guide/database' },
          { text: 'Migration', link: '/th/guide/migrations' },
        ],
      },
      {
        text: 'ข้อมูลเพิ่มเติม',
        items: [
          { text: 'pnpm และ Corepack', link: '/th/guide/pnpm' },
        ],
      },
      {
        text: 'ตัวอย่าง',
        items: [
          { text: 'Markdown', link: '/th/markdown-examples' },
          { text: 'Runtime API', link: '/th/api-examples' },
        ],
      },
    ],
    docFooter: {
      prev: 'หน้าก่อนหน้า',
      next: 'หน้าถัดไป',
    },
    returnToTopLabel: 'กลับขึ้นด้านบน',
    darkModeSwitchLabel: 'ธีม',
    sidebarMenuLabel: 'เมนู',
  },
}

export default config
