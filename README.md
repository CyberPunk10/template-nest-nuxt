# template-nest-nuxt

Монорепо шаблон: **NestJS** (backend) + **Nuxt 4** (frontend).

## Стек

|            | Версия |
| ---------- | ------ |
| Node.js    | 24     |
| pnpm       | 8      |
| NestJS     | 11     |
| Nuxt       | 4      |
| TypeScript | 6      |

## Структура

```
template-nest-nuxt/
├── apps/
│   ├── backend/        ← NestJS API (:3001)
│   └── frontend/       ← Nuxt 4 (:3000)
├── packages/
│   ├── shared/         ← @repo/shared — общие типы и i18n переводы
│   └── ui/             ← @repo/ui — общие Vue компоненты
└── ...конфиги монорепо
```

## Что настроено

- **pnpm workspaces** — монорепо с общими зависимостями
- **TypeScript** — строгий режим, общий `tsconfig.base.json`, path alias `@repo/*`
- **ESLint** — базовый конфиг в корне, приложения наследуют и расширяют
- **Prettier** — единый форматтер для всего монорепо
- **Husky + lint-staged** — проверка изменённых файлов перед коммитом
- **@repo/shared** — общие TypeScript типы (DTO) и i18n переводы
- **@repo/ui** — библиотека Vue компонентов (`UiButton`, `UiBadge`, `UiCard`)
- **Proxy** — Nuxt server route проксирует `/api/backend/*` → NestJS, без CORS в dev
- **Users CRUD** — полный REST на бекенде (`GET/POST/PUT/DELETE /users`), UI на фронтенде

## Команды

```bash
pnpm install        # установить зависимости
pnpm dev            # запустить всё параллельно
pnpm build          # собрать все workspace'ы
pnpm lint           # проверить линтером
pnpm type-check     # проверить типы
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Backend health: http://localhost:3001/health
