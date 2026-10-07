import { concurrently } from 'concurrently'
import { rememberDevSession } from './dev-session.mjs'

rememberDevSession()

concurrently(
  [
    { command: 'pnpm --filter backend dev', name: 'Nest' },
    { command: 'pnpm --filter frontend dev', name: 'Nuxt' },
    { command: 'pnpm --filter docs dev', name: 'Docs' },
  ],
  {
    prefixColors: ['#e0234e', '#ffca28', '#55a5d3'],
  },
)
