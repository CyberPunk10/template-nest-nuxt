# dev.mjs

Обёртка над [`concurrently`](https://www.npmjs.com/package/concurrently) — запускает три dev-команды (`pnpm --filter backend dev`, `pnpm --filter frontend dev`, `pnpm --filter docs dev`) как один процесс с общим выводом:

```js
concurrently(
  [
    { command: 'pnpm --filter backend dev', name: 'Nest' },
    { command: 'pnpm --filter frontend dev', name: 'Nuxt' },
    { command: 'pnpm --filter docs dev', name: 'Docs' },
  ],
  { prefixColors: ['#e0234e', '#ffca28', '#55a5d3'] },
)
```

Зачем нужен именно `concurrently`, а не три параллельных `&` в shell-скрипте:

- **Именованные и цветные префиксы** — каждая строка вывода помечена `[Nest]`/`[Nuxt]`/`[Docs]` в своём цвете (`prefixColors`), а не смешанным потоком без источника — иначе не понять, какой процесс что залогировал.
- **Единый Ctrl+C** — `concurrently` перехватывает сигнал и корректно останавливает все три дочерних процесса разом. Голый `&` в shell этого не делает: `Ctrl+C` убивает только процесс на переднем плане, а backend/frontend/docs остаются висеть в фоне и держать порты.
- **Кроссплатформенность** — работает одинаково в bash/zsh и в Windows-шеллах, не полагаясь на `&`/`wait`, которые ведут себя по-разному в разных shell.

Если один из трёх процессов падает — по умолчанию `concurrently` не останавливает остальные (это поведение можно изменить через `killOthersOn`, но здесь оно не задано: разработка backend не должна прерываться, если у docs, например, временная ошибка сборки).

## Использование

```bash
pnpm dev
```

Перед запуском автоматически отрабатывает [`predev.mjs`](./predev) — готовит `.env` и проверяет порты.

Поднять одно приложение вместо трёх — через фильтр, минуя этот скрипт:

```bash
pnpm --filter backend dev
pnpm --filter frontend dev
pnpm --filter @repo/docs dev
```
