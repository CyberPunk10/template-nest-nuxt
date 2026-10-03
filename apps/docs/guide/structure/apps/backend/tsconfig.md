# tsconfig.json

Проверка типов бэкенда — то, что видит IDE и что запускает `pnpm type-check`. Сборкой занимается [`tsconfig.build.json`](./tsconfig-build), он наследует этот файл.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2023",
    "types": ["jest", "node"],
    "resolveJsonModule": true
  },
  "include": ["src", "test"]
}
```

Всё остальное — `strict`, `skipLibCheck`, `noEmit` — приходит из [базового конфига](../../tsconfig-base).

## Почему node16

Nest грузит модули через `require`, поэтому и формат, и резолв — по правилам Node. `node16` задаёт это одним значением: он смотрит на поле `type` в `package.json`, там его нет — значит CommonJS.

Обе опции указаны вместе: TypeScript требует, чтобы они были согласованы. [Как эти опции распределены по пакетам](../../tsconfig-base).

## Декораторы

NestJS построен на декораторах: `@Module`, `@Controller`, `@Injectable`. Внедрение зависимостей работает благодаря метаданным о типах — их и включают две опции:

| Опция | Что делает |
| --- | --- |
| `experimentalDecorators` | Включает синтаксис декораторов |
| `emitDecoratorMetadata` | Сохраняет типы параметров в рантайм — из них DI понимает, что внедрять |

`emitDecoratorMetadata` несовместим с нативными ESM — ещё одна причина, по которой бэкенд остаётся на CommonJS.

## resolveJsonModule

`@repo/shared` — пакет без сборки: его `package.json` указывает `main` прямо на `src/index.ts`, поэтому бэкенд компилирует эти исходники вместе со своими. А в них импортируются переводы:

```ts
import ru from './ru.json'
```

Своего конфига у shared в этой компиляции нет — действует конфиг бэкенда, значит опция нужна здесь. Без неё `tsc` падает на файлах соседнего пакета.

## Почему ES2023

Приложение запускается на Node 24 — значит доступно всё, что поддерживает V8 этой версии. Понижать `target` смысла нет: код не идёт в браузер, и транспиляция только раздула бы результат.

## types: jest и node

Без явного списка TypeScript подключает все пакеты из `node_modules/@types`, включая ненужные. Здесь указаны два:

- **`jest`** — глобалы `describe`, `it`, `expect`. Без него спеки подсвечиваются ошибкой `Cannot find name 'describe'`.
- **`node`** — `process`, `Buffer`, `__dirname` и остальное серверное окружение.

## Почему в include есть test

```json
"include": ["src", "test"]
```

`test/` содержит e2e-спеки. Без этой строки они остались бы вне проекта: IDE не видела бы глобалы jest, а `pnpm type-check` молча пропускал бы файлы целиком — ошибки типов в тестах обнаруживались бы только при запуске.

На сборку это не влияет: `tsconfig.build.json` исключает `test` отдельно.
