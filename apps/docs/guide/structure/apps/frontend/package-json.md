# package.json

Манифест frontend-приложения. Скрипты работают только внутри своего воркспейса — из корня вызываются через фильтр (`pnpm --filter frontend dev`) или транзитивно из корневых команд.

| Скрипт        | Команда          | Что делает                                                                          |
| ------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `dev`         | `nuxt dev`       | Локальная разработка с hot-reload                                                   |
| `build`       | `nuxt build`     | Production-сборка в `.output/`                                                      |
| `preview`     | `nuxt preview`   | Локальный запуск production-сборки                                                  |
| `generate`    | `nuxt generate`  | Статическая сборка. В этом шаблоне не используется: образ запускает SSR             |
| `postinstall` | `nuxt prepare`   | Генерирует `.nuxt/` (типы, алиасы) — запускается автоматически после `pnpm install` |
| `lint`        | `eslint . --fix` | Линтер с автофиксом                                                                 |
| `type-check`  | `nuxt typecheck` | Проверка типов через `vue-tsc`                                                      |

## Зависимости

| Пакет | Зачем |
| --- | --- |
| `nuxt`, `vue`, `vue-router` | Nuxt и Vue, на которых построено приложение |
| `@nuxtjs/i18n` | Переводы интерфейса (ru, en, th) |
| `@nuxtjs/color-mode` | Светлая и тёмная тема |
| `@nuxt/icon` | Компонент `<Icon>` для иконок Iconify |
| `@vueuse/core` | SSR-безопасные обёртки над API браузера |
| `vue-tippy` | Всплывающие подсказки (`app/plugins/tippy.ts`) |
| `@repo/shared`, `@repo/ui` | Общие типы и UI-компоненты из `packages/` |

| Пакет для разработки | Зачем |
| --- | --- |
| `@iconify-json/lucide` | Иконки Lucide локально: сервер отдаёт их сам, без запросов к API Iconify |
| `sass` | Компиляция SCSS в стилях компонентов |
| `@nuxt/eslint` | Конфиг ESLint, который учитывает автоимпорты Nuxt |
| `vue-tsc` | Проверка типов в `.vue`-файлах для `nuxt typecheck` |

Что где лежит — [apps/frontend](./).
