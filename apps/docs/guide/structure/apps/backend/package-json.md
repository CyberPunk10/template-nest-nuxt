# package.json

Манифест backend-приложения. Скрипты работают только внутри своего воркспейса — из корня вызываются через фильтр (`pnpm --filter backend dev`) или транзитивно из корневых команд.

| Скрипт                             | Команда              | Что делает                                                                               |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `dev`                              | `nest start --watch` | Локальная разработка с hot-reload                                                        |
| `build`                            | `nest build`         | Production-сборка в `dist/`                                                              |
| `start`                            | `nest start`         | Запуск собранного `dist/` без watch                                                      |
| `start:prod`                       | `node dist/main`     | Запуск в production-режиме (то, что использует `Dockerfile`)                             |
| `lint`                             | `eslint ... --fix`   | Линтер с автофиксом                                                                      |
| `type-check`                       | `tsc --noEmit`       | Проверка типов без сборки                                                                |
| `start:debug`                      | `nest start --debug` | То же с открытым портом отладчика                                                        |
| `test` / `test:watch` / `test:cov` | `jest ...`           | Юнит-тесты: разово, в watch-режиме, с покрытием                                          |
| `test:debug`                       | `node --inspect-brk` | Тесты под отладчиком, в один поток (`--runInBand`)                                       |
| `test:e2e`                         | `jest --config ...`  | E2E-тесты, свой конфиг `test/jest-e2e.json`                                              |
| `test:e2e:throttle`                | `jest --config ...`  | E2E rate limiting — отдельным конфигом, чтобы лимиты одного теста не влияли на остальные |

Что где лежит — [apps/backend](./).
