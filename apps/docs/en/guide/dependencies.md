# Updating dependencies

Package versions live in two places: ranges (`^11.2.8`) in the `package.json` of each workspace package, and the exact installed versions of the whole tree in `pnpm-lock.yaml`. An update is a deliberate change to both files that shows up in the diff and goes through the same checks as any other code.

## 1. See what is outdated

```bash
pnpm outdated -r
```

Shows the installed and the latest published version for every workspace package.

## 2. Update within ranges

```bash
pnpm update -r    # same thing as the pnpm deps:sync script
```

`-r` means across all workspace packages. The command raises packages to the latest versions their ranges allow and writes the new values to `package.json`. The lockfile is extended, not recalculated from scratch. For `^` that means minor and patch versions, for `~` patch versions only.

Update a single package:

```bash
pnpm update -r vue
```

## 3. Major versions — one at a time

A major version goes beyond the range and may break the API, so make such updates separately from the rest and one package at a time:

```bash
pnpm update -r --latest --interactive
```

The command lists available updates and lets you pick the ones you need. Before a major update, read the package's release notes or migration guide.

## 4. Check

Run the linter, type checking, build and tests:

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm test
pnpm test:e2e
```

## Hold a version back

If a new version of a package is broken, replace `^` with `~` — then `pnpm update -r` takes only patch versions and won't pull in the broken minor. In the commit message, state the reason and the condition for switching back to `^`, for example a link to the issue.

## Update pnpm

```bash
pnpm self-update
```

Inside the project the command changes only the version in `packageManager` of the root `package.json` and leaves the global pnpm alone. Commit `package.json` together with `pnpm-lock.yaml` — other developers' pnpm switches to the new version by itself on first run.

## Vulnerabilities

```bash
pnpm audit
```

Some vulnerabilities sit deep in transitive dependencies of build tools and can't be fixed by an update on your side. Look at the path (`Paths`): a vulnerability in a package that ends up in the production build matters more than one in a dev tool.

## Reinstall everything from scratch

```bash
pnpm reinstall
```

[`pnpm reinstall`](./structure/scripts/reinstall) is not a way to update, but a last resort when local dependencies are broken and nothing else helped.

::: warning
The command deletes `node_modules` and the lockfile entirely and installs everything from scratch: all transitive dependencies are pulled in at new versions at once, and something in the project may break so that you'll have to track down the cause and fix it. Always review the `pnpm-lock.yaml` diff before committing.
:::
