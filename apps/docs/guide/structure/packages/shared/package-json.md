# package.json

```json
{
  "name": "@repo/shared",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

| Скрипт       | Команда        | Что делает              |
| ------------ | -------------- | ----------------------- |
| `type-check` | `tsc --noEmit` | Проверка типов без сборки |

Скрипта `build` нет: `main` и `types` указывают прямо на `src/index.ts` — пакет потребляется исходниками, а сборкой занимаются сами приложения.

`private: true` — пакет не публикуется в реестр, он подключается через `workspace:*`.

Из зависимостей — только `typescript` в `devDependencies`: для скрипта `type-check`.
