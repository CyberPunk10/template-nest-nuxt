# Wrong pnpm version

The exact pnpm version is pinned in `packageManager` of the root `package.json`. Any pnpm 12 or newer you have installed switches to it by itself inside the project folder, so your global version may differ — that's fine.

## Symptoms

`pnpm install` refuses to run:

```
ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment (bad pnpm and/or Node.js version)
Expected version: >=12
Got: 9.15.9
```

Or pnpm tries to switch to the pinned version and fails:

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: pnpm@12.15.0
```

Or inside the project folder `pnpm --version` shows a version other than the one in `packageManager`.

## Cause

A pnpm that is too old is being run: version 9 and early 10 can't switch to the version from `packageManager`. Such a pnpm is often left over from earlier installation methods — a machine may have several, and the one that comes first in `$PATH` runs.

## Fix

Update pnpm:

```bash
npm install -g pnpm
```

If inside the project folder `pnpm --version` still doesn't match `packageManager`, check which pnpm installations exist:

```bash
which -a pnpm
```

The first one in the list is the one that runs. Remove the extra installations:

| Path | Installed by | How to remove |
| --- | --- | --- |
| `~/.local/share/pnpm/pnpm` | script from pnpm.io | `rm -rf ~/.local/share/pnpm`, then remove the `# pnpm … # pnpm end` block from `~/.zshrc` or `~/.bashrc` |
| `~/.nvm/versions/node/vX.Y.Z/bin/pnpm` | `npm install -g pnpm` under nvm | `npm uninstall -g pnpm` in that Node version |
| `/usr/bin/pnpm` | system npm | `sudo npm uninstall -g pnpm` |

After each removal, check `which -a pnpm` and `pnpm --version` again.
