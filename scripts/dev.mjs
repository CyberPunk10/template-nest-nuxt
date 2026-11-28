import { concurrently } from 'concurrently'
import { rememberDevSession } from './dev-session.mjs'

rememberDevSession()

// Если приложение завершилось с ошибкой, concurrently уже напечатал его
// вывод и код выхода. Промис result отклоняется массивом этих завершений;
// без обработки Node добавил бы к ним бесполезную трассировку
// UnhandledPromiseRejection. Поэтому только выходим с кодом 1.
const { result } = concurrently(
  [
    { command: 'pnpm --filter backend dev', name: 'Nest' },
    { command: 'pnpm --filter frontend dev', name: 'Nuxt' },
    { command: 'pnpm --filter docs dev', name: 'Docs' },
  ],
  {
    prefixColors: ['#e0234e', '#ffca28', '#55a5d3'],
  },
)

result.catch(() => {
  process.exitCode = 1
})
