# tsconfig.json

Type checking for the backend — what the IDE sees and what `pnpm type-check` runs. Building is handled by [`tsconfig.build.json`](./tsconfig-build), which extends this file.

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

Everything else — `strict`, `skipLibCheck`, `noEmit` — comes from the [base config](../../tsconfig-base).

## Why node16

Nest loads modules through `require`, so both the format and the resolution follow Node's rules. `node16` sets both with one value: it looks at the `type` field in `package.json`, there is none — so the format is CommonJS.

Both options are spelled out together: TypeScript requires them to agree. [How these options are distributed across packages](../../tsconfig-base).

## Decorators

NestJS is built on decorators: `@Module`, `@Controller`, `@Injectable`. Dependency injection works thanks to type metadata — and two options turn it on:

| Option | What it does |
| --- | --- |
| `experimentalDecorators` | Enables decorator syntax |
| `emitDecoratorMetadata` | Keeps parameter types at runtime — DI reads them to know what to inject |

`emitDecoratorMetadata` is incompatible with native ESM — one more reason the backend stays on CommonJS.

## resolveJsonModule

`@repo/shared` ships without a build step: its `package.json` points `main` straight at `src/index.ts`, so the backend compiles those sources along with its own. And they import translations:

```ts
import ru from './ru.json'
```

Shared's own config takes no part in that compilation — the backend's config applies, so the option belongs here. Without it `tsc` fails on a neighbouring package's files.

## Why ES2023

The app runs on Node 24, so everything that version's V8 supports is available. Lowering `target` would serve no purpose: the code never reaches a browser, and transpiling would only bloat the output.

## types: jest and node

Without an explicit list, TypeScript pulls in every package under `node_modules/@types`, including irrelevant ones. Two are named here:

- **`jest`** — the `describe`, `it`, `expect` globals. Without it specs are flagged with `Cannot find name 'describe'`.
- **`node`** — `process`, `Buffer`, `__dirname` and the rest of the server environment.

## Why include covers test

```json
"include": ["src", "test"]
```

`test/` holds the e2e specs. Without this line they'd sit outside the project: the IDE wouldn't see the jest globals, and `pnpm type-check` would silently skip the files entirely — type errors in tests would only surface at run time.

The build isn't affected: `tsconfig.build.json` excludes `test` separately.
