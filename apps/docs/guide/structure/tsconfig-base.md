# tsconfig.base.json

Конфигов TypeScript в репозитории семь. Чтобы в них не путаться, полезно держать в голове один принцип: **все они, кроме одного, служат только проверке типов**. Компилируют код другие инструменты — `nest build`, Nuxt, VitePress. Единственное исключение — [`apps/backend/tsconfig.build.json`](./apps/backend/tsconfig-build).

## Как устроено наследование

```
template-nest-nuxt/
├── tsconfig.base.json          ← общее основание
│
├── apps/
│   ├── backend/
│   │   ├── tsconfig.json
│   │   └── tsconfig.build.json ← наследует tsconfig.json выше, а не base
│   ├── frontend/
│   │   └── tsconfig.json
│   └── docs/
│       └── tsconfig.json
│
└── packages/
    ├── shared/
    │   └── tsconfig.json
    └── ui/
        └── tsconfig.json
```

Базовый конфиг наследуют все, кроме `apps/frontend`: его настоящие конфиги генерирует Nuxt в `.nuxt/`, а сам файл лишь ссылается на них. Ничего не наследует и генератор — Nuxt прописывает все опции целиком, включая те же `strict` и `noEmit`, что и здесь. [Подробнее](./apps/frontend/tsconfig).

Каждый файл содержит **только то, что отличает его** от базового. Если опция не упомянута — она наследуется, и это осознанно: дублировать `strict` в каждом конфиге значит однажды получить пакет, где его случайно нет.

## Что лежит в базовом

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "noEmit": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

| Опция | Зачем |
| --- | --- |
| `strict` | Строгие проверки целиком, включая `strictNullChecks` |
| `esModuleInterop` | Импорт CommonJS-пакетов через `import x from` без `* as` |
| `forceConsistentCasingInFileNames` | Регистр в путях: на macOS ошибка не всплывёт, в Docker сборка упадёт |
| `skipLibCheck` | Не проверять типы внутри `node_modules` — быстрее и без чужих ошибок |
| `noEmit` | Ничего не генерировать |
| `noImplicitOverride` | Переопределение метода требует ключевого слова `override` |
| `noFallthroughCasesInSwitch` | Запрещает «проваливание» между `case` без `break` |

### Почему `noEmit` в базовом, а не в каждом файле

Без него любой прямой запуск `tsc` — руками, из IDE, из незнакомого инструмента — разложит `.js` рядом с исходниками. Скрипт `type-check` передаёт `--noEmit` флагом, но защита, живущая только в команде, не срабатывает, когда команду не используют.

Конфиг сборки отменяет это явно: `"noEmit": false`.

### Две проверки сверх `strict`

`noImplicitOverride` и `noFallthroughCasesInSwitch` в `strict` не входят — их включают отдельно.

Первая требует помечать переопределение явно:

```ts
class Child extends Base {
  handle() { }           // ошибка
  override handle() { }  // так правильно
}
```

Смысл не в формальности: без неё легко молча перекрыть родительский метод, думая, что пишешь новый. Обратный случай опаснее — переименовали метод в базовом классе, и переопределение в наследнике тихо перестало вызываться.

Вторая ловит забытый `break`:

```ts
switch (status) {
  case 'active':
    doSomething()      // ошибка: провалится в 'archived'
  case 'archived':
    cleanup()
}
```

Намеренное объединение веток при этом разрешено — пустой `case` без кода ошибкой не считается.

## Чего в базовом намеренно нет

### `paths` для `@repo/*`

Соблазнительно прописать пути к workspace-пакетам:

```json
// так НЕ надо
"paths": {
  "@repo/shared": ["./packages/shared/src/index.ts"]
}
```

Это не нужно и вредно. Не нужно — потому что pnpm кладёт симлинки в `node_modules/@repo/`, а `package.json` пакета указывает `main` прямо на `src/index.ts`; TypeScript находит его сам. Вредно — потому что `paths` ведёт на **исходники соседнего пакета**, и при сборке бэкенда `tsc` пытается компилировать их вместе с ним:

```
error TS6059: File '.../packages/shared/src/types/api.ts' is not under
rootDir '.../apps/backend/src'. 'rootDir' is expected to contain all source files.
```

Лечить это пришлось бы сбросом `"paths": {}` в конфиге сборки — костыль, который существует только чтобы обойти ненужную настройку.

### `module` и `moduleResolution`

Эти две опции описывают, как код грузится в рантайме — а рантайм у пакетов разный, поэтому общего значения нет.

| Пакет | Значения | Кто грузит код |
| --- | --- | --- |
| `apps/backend` | `node16` | Node через `require` |
| `packages/shared`, `packages/ui`, `apps/docs` | `ESNext` + `bundler` | Vite, Rollup, VitePress |

Обе опции объявляет сам пакет, рядом друг с другом — их нельзя рассогласовать, поменяв одну и забыв вторую.

### `target` и `lib`

У бэкенда среда — Node, у Vue-пакетов — браузер. Общего значения нет, поэтому каждый задаёт своё.

## Конфиги пакетов

Что добавляет каждый поверх базового:

| Конфиг | Отличия |
| --- | --- |
| [`apps/backend`](./apps/backend/tsconfig) | резолв `node16`, декораторы, типы jest |
| [`apps/backend/tsconfig.build.json`](./apps/backend/tsconfig-build) | единственный, кто компилирует |
| [`apps/frontend`](./apps/frontend/tsconfig) | не наследует базовый — конфиги генерирует Nuxt |
| [`apps/docs`](./apps/docs/tsconfig) | резолв `bundler`, DOM lib, типы VitePress |
| [`packages/shared`](./packages/shared/tsconfig) | резолв `bundler`, resolveJsonModule для переводов |
| [`packages/ui`](./packages/ui/tsconfig) | резолв `bundler`, DOM lib для компонентов |

## Проверка типов

```bash
pnpm type-check
```

Обходит все воркспейсы, но инструмент у каждого свой:

| Пакет | Команда | Почему |
| --- | --- | --- |
| `backend`, `shared` | `tsc --noEmit` | Чистый TypeScript |
| `ui`, `docs` | `vue-tsc --noEmit` | `tsc` не разбирает `.vue` |
| `frontend` | `nuxt typecheck` | Нужны сгенерированные типы из `.nuxt/` |
