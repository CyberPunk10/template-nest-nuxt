# package.json

Манифест backend-приложения. Скрипты работают только внутри своего воркспейса — из корня вызываются через фильтр (`pnpm --filter backend dev`) или транзитивно из корневых команд.

| Скрипт                             | Команда              | Что делает                                                   |
| ---------------------------------- | -------------------- | ------------------------------------------------------------ |
| `dev`                              | `nest start --watch` | Локальная разработка с hot-reload                            |
| `build`                            | `nest build`         | Production-сборка в `dist/`                                  |
| `start`                            | `nest start`         | Запуск собранного `dist/` без watch                          |
| `start:prod`                       | `node dist/main`     | Запуск в production-режиме (то, что использует `Dockerfile`) |
| `lint`                             | `eslint ... --fix`   | Линтер с автофиксом                                          |
| `type-check`                       | `tsc --noEmit`       | Проверка типов без сборки                                    |
| `start:debug`                      | `nest start --debug` | То же с открытым портом отладчика                            |
| `test` / `test:watch` / `test:cov` | `jest ...`           | Юнит-тесты: разово, в watch-режиме, с покрытием              |
| `test:debug`                       | `node --inspect-brk` | Тесты под отладчиком, в один поток (`--runInBand`)           |
| `test:e2e`                         | `jest --config ...`  | E2E-тесты, свой конфиг `test/jest-e2e.json`                  |

## Зависимости

| Пакет | Зачем |
| --- | --- |
| `@nestjs/core`, `@nestjs/common` | Ядро NestJS: модули, контроллеры, внедрение зависимостей |
| `@nestjs/platform-express` | HTTP-сервер на Express под NestJS |
| `reflect-metadata`, `rxjs` | Обязательные зависимости NestJS: метаданные декораторов и потоки |
| `@nestjs/config` | Чтение `.env` и доступ к настройкам через `ConfigService` |
| `joi` | Проверка переменных окружения при старте (`src/config/env.validation.ts`) |
| `@nestjs/swagger` | Swagger UI и описание API из декораторов, только вне production |
| `class-validator`, `class-transformer` | Проверка и преобразование тел запросов в DTO |
| `@repo/shared` | Общие типы с фронтендом из `packages/shared` |

| Пакет для разработки | Зачем |
| --- | --- |
| `@nestjs/cli` | Команды `nest start` и `nest build` |
| `@nestjs/schematics` | Генераторы `nest generate` (модуль, контроллер, сервис) |
| `typescript` | Компилятор TypeScript |
| `jest`, `ts-jest`, `@types/jest` | Тесты на TypeScript без отдельной сборки |
| `@nestjs/testing` | Тестовый модуль NestJS с подменой зависимостей |
| `supertest`, `@types/supertest` | HTTP-запросы к приложению в E2E-тестах |
| `@types/node`, `@types/express` | Типы Node.js и Express |

Что где лежит — [apps/backend](./).
