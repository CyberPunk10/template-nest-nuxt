# tsconfig.json

Конфиг пакета Vue-компонентов:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext", "DOM"]
  },
  "include": ["src/**/*"]
}
```

## Зачем DOM lib

Компоненты работают в браузере: обращаются к `HTMLElement`, слушают события, читают размеры узлов. В [базовом конфиге](../../tsconfig-base) DOM-типов нет намеренно — он общий для всех пакетов, включая бэкенд, где браузерного API не существует.

`target: ESNext` — по той же причине: код проходит через Vite, который сам решает, что и как транспилировать под целевые браузеры. Понижать версию на этом уровне незачем.

## Почему нет outDir

Пакет source-only, как и [`@repo/shared`](../shared/tsconfig): `main` и `types` в `package.json` указывают на `src/index.ts`. Nuxt подхватывает `.vue` напрямую через Vite — отдельная сборка не нужна и только добавила бы шаг между правкой и результатом.

## Проверка типов

```bash
pnpm --filter @repo/ui type-check
```

Здесь `vue-tsc --noEmit`, а не `tsc`: обычный компилятор не разбирает однофайловые компоненты и споткнулся бы на первом же `<template>`.
