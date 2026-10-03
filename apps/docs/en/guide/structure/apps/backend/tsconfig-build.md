# tsconfig.build.json

The config for `nest build` — the only one in the repository that actually compiles code. The rest exist for type checking.

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./src",
    "outDir": "./dist",
    "preserveWatchOutput": true
  },
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

It extends not the base config but [the neighbouring `tsconfig.json`](./tsconfig) — so it inherits both the Nest settings and the shared rules from the base.

## noEmit: false

The base config forbids emitting files so that a stray `tsc` run doesn't scatter `.js` next to the sources. Here the ban is lifted — this is the actual build.

## rootDir and outDir

Without `rootDir` the compiler takes the common ancestor of all input files as the root, and the directory structure leaks into the output:

```
dist/apps/backend/src/main.js     ← without rootDir
dist/main.js                      ← with rootDir: ./src
```

The second form is what makes `CMD ["node", "dist/main"]` in the Dockerfile work without a long path.

## preserveWatchOutput

In watch mode `tsc` clears the screen on every recompile by default. Under a parallel `pnpm dev` from the root that would wipe the Nuxt logs with the startup addresses — they're printed once, and losing them is inconvenient.

## Why tests are excluded

```json
"exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
```

The neighbouring `tsconfig.json` does the opposite and includes `test` — needed there for type checking. The build doesn't need tests: they never reach the image, and `*.spec.ts` files sitting next to the sources would otherwise land in `dist/`.
