# versions.test.mjs

Тест, который проверяет, что версия Node записана в проекте одинаково во всех местах. Запускается первым в `pnpm test`.

| Место | Что проверяется |
|---|---|
| `.nvmrc` | точная версия вида `24.22.1` — по ней работают `nvm use`, CI и проверка в [`predev.mjs`](./predev) |
| `engines.node` в корневом `package.json` | ровно `>=` версии из `.nvmrc` |
| `FROM node:…` в Dockerfile из `apps/*` и `infra/*` | тот же мажор и минор, что в `.nvmrc`: `node:24.22-alpine` для `24.22.1` |

## Зачем

Обновляя Node, легко поправить `.nvmrc` и забыть Dockerfile: локально всё работает на новой версии, а образы Docker остаются на старой. Тест упадёт и назовёт файл:

```
apps/frontend/Dockerfile: node:24.21-alpine, but .nvmrc has 24.22.1
```

## Использование

```bash
pnpm test                                # вместе с остальными тестами
node --test scripts/versions.test.mjs    # только эта проверка
```
