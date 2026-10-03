# tsconfig.json

Проверка типов темы VitePress: Vue-компоненты и `.vitepress/config.ts`. Саму документацию собирает VitePress, этот конфиг только для типов.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext", "DOM"],
    "types": ["vitepress/client", "node"],
    "resolveJsonModule": true
  },
  "include": [".vitepress/**/*.ts", ".vitepress/**/*.vue"],
  "exclude": [".vitepress/dist", ".vitepress/cache"]
}
```

## target и lib

Тема исполняется в браузере, поэтому нужны DOM-типы: `document`, `window`, `HTMLElement`. В [базовом конфиге](../../tsconfig-base) их нет намеренно — он не привязан к среде, а у бэкенда окружение другое.

## types: зачем vitepress/client

Пакет `vitepress/client` реэкспортирует `vite/client`, где объявлены модули `*.vue`, `*.css` и прочие ассеты. Без него любой импорт компонента в теме подсвечивается ошибкой:

```
Cannot find module './components/Home/HomeHero.vue'
```

`node` нужен самому `config.ts` — он работает в Node: читает `process.env`, собирает пути через `path` и `url`.

## resolveJsonModule

Переводы интерфейса лежат в `.vitepress/locales/*.json` и импортируются напрямую. Без этой опции TypeScript откажется резолвить такой импорт.

## Проверка типов

```bash
pnpm --filter @repo/docs type-check
```

Запускает `vue-tsc --noEmit`, а не обычный `tsc`: последний не разбирает `.vue` и увидел бы в компонентах синтаксическую ошибку.
