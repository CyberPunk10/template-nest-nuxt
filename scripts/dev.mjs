import { concurrently } from 'concurrently'

concurrently(
  [
    { command: 'pnpm --filter backend dev', name: 'Nest' },
    { command: 'pnpm --filter frontend dev', name: 'Nuxt' },
  ],
  {
    prefixColors: ['#e0234e', '#ffca28'],
  },
)
