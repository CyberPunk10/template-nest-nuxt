# tsconfig.json

Пакету нужно немногое сверх [базового](../../tsconfig-base) — только описать, куда он едет:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext"],
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

## resolveJsonModule

Переводы лежат в `src/i18n/*/*.json` и импортируются напрямую:

```ts
import ru from './ru.json'
```

Без этой опции TypeScript откажется резолвить такой импорт. Она же даёт типизацию по содержимому файла — структура перевода выводится автоматически.

## module, moduleResolution и target

Пакет source-only: в `package.json` поля `main` и `types` указывают прямо на `src/index.ts`, сборки нет. Потребители компилируют исходники сами — Nuxt через Vite, доки через VitePress, бэкенд в составе `nest build`.

Тем не менее свои значения нужны: по этому конфигу работает `pnpm type-check` и IDE. Здесь они описывают основной сценарий — сборку бандлером:

| Опция | Значение |
| --- | --- |
| `module` | `ESNext` — нативные ES-модули, их и ждёт Vite |
| `moduleResolution` | `bundler` — резолв как у Vite и Rollup |
| `target` | `ESNext` — понижать незачем, транспиляцией займётся потребитель |

`outDir` не нужен: пакет ничего не собирает, а `noEmit` приходит из базового.

Когда исходники компилирует бэкенд, действует уже [его конфиг](../../apps/backend/tsconfig) с резолвом Node — файлы те же, правила другие. Поэтому код здесь пишется так, чтобы проходить обе проверки.

## Почему lib без DOM

Соседний [`packages/ui`](../ui/tsconfig) добавляет в `lib` значение `DOM`, здесь его нет намеренно. Пакет едет и в браузер, и в Node — обращение к `window` или `document` в общем коде сломало бы бэкенд в рантайме. Без `DOM` такая попытка становится ошибкой типизации, а не сюрпризом на сервере.

## Проверка типов

```bash
pnpm --filter @repo/shared type-check
```

Обычный `tsc --noEmit` — в пакете только `.ts`, Vue-компонентов нет.
