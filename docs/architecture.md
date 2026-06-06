# Архитектура монорепо

[← Главная](../README.md) · [База данных](database.md)

## Пакеты и зависимости

```
template-nest-nuxt/
├── apps/
│   ├── frontend   (@repo/frontend)   Nuxt 4 · :3000
│   └── backend    (@repo/backend)    NestJS  · :3001
└── packages/
    ├── shared     (@repo/shared)     TypeScript типы + i18n
    └── ui         (@repo/ui)         Vue компоненты

Зависимости (workspace:*):

  frontend ──► shared
  frontend ──► ui
  backend  ──► shared

  ui и shared не зависят ни от кого внутри монорепо.
  backend не знает про frontend — связь только через HTTP.

Связь между приложениями:

  frontend ──► [HTTP /api/backend/*] ──► backend
               (Nuxt server proxy,
                без CORS в dev)

  Nuxt проксирует /api/backend/* на http://localhost:3001.
  В prod proxy настраивается через переменную NUXT_PUBLIC_API_BASE.
```

---

## Пакеты: как потребляются

```
@repo/shared
  Компилируется в dist/ (ESM, tsc).
  Backend и frontend получают скомпилированный код.
  Нужна компиляция, потому что backend — CommonJS,
  frontend — ESM/Rollup; общий dist/ работает для обоих.

@repo/ui
  Source-only. Компиляция не нужна.
  Используется только фронтендом через Vite,
  который обрабатывает .vue и .ts напрямую.
  Нельзя скомпилировать просто через tsc — .vue файлы
  требуют vue-tsc + специального пайплайна.
```

---

## TypeScript конфиги

```
tsconfig.base.json               ← корень монорепо, только для IDE и type-check
│  strict, ES2022
│  paths: {
│    "@repo/shared" → packages/shared/dist/index.d.ts   ← скомпилированные типы
│    "@repo/ui"     → packages/ui/src/index.ts           ← исходник (source-only)
│  }
│  Эти пути нужны только IDE для резолва типов.
│  В рантайме модули резолвятся через pnpm workspace (package.json → main).
│
├── shared/tsconfig.json
│      rootDir: ./src  outDir: ./dist
│      module: ESNext  moduleResolution: bundler
│      Компилируется в ESM — нужно для Rollup (Nuxt).
│
├── frontend/tsconfig.json  ← генерируется Nuxt автоматически, не трогать
│
├── ui/tsconfig.json        ← НЕ наследует base (нужен jsx + DOM lib)
│      source-only пакет, dist не нужен — Nuxt/Vite обрабатывает .vue напрямую
│      Используется только для vue-tsc --noEmit (type-check).
│
└── backend/tsconfig.json        ← для IDE и type-check, noEmit: true
       module: commonjs
       experimentalDecorators: true   ← нужно для NestJS декораторов
       │
       └── backend/tsconfig.build.json   ← для nest build, noEmit: false
              rootDir: ./src             ← даёт чистый dist/main.js
              outDir: ./dist             ← без вложенных путей apps/backend/src/...
```

---

## Docker: стадии сборки

Оба сервиса собираются в две стадии:

```
  [ builder ]                          [ runner ]
  ───────────                          ──────────
  COPY package.json манифесты          Финальный образ.
  pnpm install --frozen-lockfile       Только то, что нужно для запуска.
  COPY исходники
  Собираем проект.

  Backend дополнительно запускает pnpm deploy --prod /deploy
  — копирует из node_modules только зависимости @repo/backend,
  без лишних пакетов монорепо. Runner получает чистый плоский node_modules.

  Frontend этого не делает — Nuxt сам упаковывает все зависимости
  в .output при сборке. node_modules в runner не нужен вообще.

  Почему install идёт до COPY исходников?
  Docker кэширует послойно — если исходники изменились,
  но package.json нет, install берётся из кэша.
  Порядок: COPY манифесты → pnpm install → COPY . .
```

**Backend builder:**

```
1. pnpm install --frozen-lockfile   ← устанавливает все зависимости монорепо
                                       --frozen-lockfile гарантирует точные версии
                                       как в локальной разработке
2. pnpm build @repo/shared          ← компилирует shared в ESM (dist/)
                                       нужно до nest build, т.к. backend импортирует из dist/
3. nest build                       ← компилирует backend в dist/
4. pnpm deploy --prod /deploy       ← копирует только нужные зависимости в /deploy
                                       не скачивает заново — берёт из node_modules
```

**Backend runner:**

```
/app/
├── node_modules/                 ← только зависимости @repo/backend (pnpm deploy)
│                                    плоская структура, без лишних пакетов монорепо
└── dist/
    └── main.js                   ← скомпилированный код (rootDir: ./src → чистый путь)

CMD: node dist/main
```

**Frontend runner:**

```
/app/
└── .output/                      ← Nuxt упаковывает всё сюда при сборке
    ├── server/
    │   └── index.mjs             ← точка входа (Node.js server)
    └── public/                   ← статика (JS, CSS, assets)

CMD: node .output/server/index.mjs

node_modules не нужен — все зависимости уже внутри .output.
.output можно скопировать на сервер и запустить без pnpm.
```
