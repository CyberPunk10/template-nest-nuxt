# apps/backend

NestJS-приложение. Точка входа — `src/main.ts`.

```
apps/backend/
├── src/
│   ├── common/
│   │   ├── filters/            глобальные фильтры исключений
│   │   └── transforms/         трансформеры для DTO
│   ├── config/
│   │   └── env.validation.ts   Joi-схема переменных окружения
│   ├── modules/
│   │   ├── auth/               регистрация, вход, refresh, сессии
│   │   ├── tasks/              CRUD задач
│   │   └── users/              пользователи
│   ├── app.controller.ts       /, /health, /dev/config
│   ├── app.module.ts           корневой модуль
│   ├── app.service.ts
│   ├── setup-app.ts            общие глобальные настройки для main и e2e
│   └── main.ts                 bootstrap: CORS, Swagger, ValidationPipe
├── prisma/                     схема БД, миграции, seed
├── test/                       e2e-тесты (отдельный jest-конфиг)
├── nest-cli.json
├── tsconfig.json               для IDE и type-check (noEmit)
└── tsconfig.build.json         для nest build — даёт чистый dist/
```

## Соглашения Nest

Жёстких требований к расположению файлов у Nest нет — всё связывается декораторами и модулями. Принятая в проекте раскладка:

- **`modules/<имя>/`** — законченная функциональность: контроллер, сервис, DTO. Каждый модуль регистрируется в `app.module.ts`
- **`common/`** — то, что применяется ко всему приложению: фильтры, гварды, интерсепторы. Здесь лежит фильтр, приводящий все ошибки к единому JSON
- **`config/`** — валидация окружения. Схема проверяется при старте: не хватает обязательной переменной — приложение не поднимется

## Два tsconfig

`tsconfig.json` работает с `noEmit` — он нужен IDE и команде `type-check`. Сборкой занимается `tsconfig.build.json`, где задан `rootDir: ./src`: без него `dist/` повторил бы путь `apps/backend/src/...` и точка входа переехала бы с `dist/main.js`.

Подробнее про конфиги — [tsconfig.base.json](../../tsconfig-base).

Скрипты приложения — [package.json](./package-json).
