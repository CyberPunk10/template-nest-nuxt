# dev.mjs

A wrapper around [`concurrently`](https://www.npmjs.com/package/concurrently) — runs the three dev commands (`pnpm --filter backend dev`, `pnpm --filter frontend dev`, `pnpm --filter docs dev`) as one process with combined output:

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

Why `concurrently` specifically, and not three parallel `&` in a shell script:

- **Named, colored prefixes** — every output line is tagged `[Nest]`/`[Nuxt]`/`[Docs]` in its own color (`prefixColors`), instead of a mixed stream with no indication of source — otherwise there's no way to tell which process logged what.
- **A single Ctrl+C** — `concurrently` intercepts the signal and cleanly stops all three child processes at once. A bare `&` in a shell doesn't do this: `Ctrl+C` only kills the foreground process, while backend/frontend/docs keep running in the background, holding their ports.
- **Cross-platform** — works the same in bash/zsh and in Windows shells, without relying on `&`/`wait`, which behave differently across shells.

If one of the three processes crashes, `concurrently` doesn't stop the others by default (this can be changed via `killOthersOn`, but it isn't set here: backend development shouldn't be interrupted just because docs, say, has a temporary build error).

## Usage

```bash
pnpm dev
```

[`predev.mjs`](./predev) runs automatically beforehand — it prepares the `.env` files and checks the ports.

To bring up one application instead of three, use a filter and bypass this script:

```bash
pnpm --filter backend dev
pnpm --filter frontend dev
pnpm --filter @repo/docs dev
```
