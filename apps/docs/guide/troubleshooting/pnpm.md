# Не та версия pnpm

Точная версия pnpm закреплена в `packageManager` корневого `package.json`. Установленный у вас pnpm 12 и новее в папке проекта сам переключается на неё, поэтому ваша глобальная версия может отличаться — это нормально.

## Симптомы

`pnpm install` отказывается работать:

```
ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment (bad pnpm and/or Node.js version)
Expected version: >=12
Got: 9.15.9
```

Или pnpm пытается переключиться на закреплённую версию и падает:

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: pnpm@12.15.0
```

Или в папке проекта `pnpm --version` показывает не ту версию, что в `packageManager`.

## Причина

Запускается слишком старый pnpm: версии 9 и ранние 10 не умеют переключаться на версию из `packageManager`. Часто такой pnpm остаётся от прошлых способов установки — на машине их бывает несколько, и запускается тот, что первым стоит в `$PATH`.

## Решение

Обновите pnpm:

```bash
npm install -g pnpm
```

Если в папке проекта `pnpm --version` всё ещё не совпадает с `packageManager`, посмотрите, какие pnpm установлены:

```bash
which -a pnpm
```

Первым в списке идёт тот, что запускается. Удалите лишние установки:

| Путь | Как установлен | Как удалить |
| --- | --- | --- |
| `~/.local/share/pnpm/pnpm` | скрипт с pnpm.io | `rm -rf ~/.local/share/pnpm`, затем убрать блок `# pnpm … # pnpm end` из `~/.zshrc` или `~/.bashrc` |
| `~/.nvm/versions/node/vX.Y.Z/bin/pnpm` | `npm install -g pnpm` под nvm | `npm uninstall -g pnpm` в нужной версии Node |
| `/usr/bin/pnpm` | системный npm | `sudo npm uninstall -g pnpm` |

После каждого удаления проверяйте `which -a pnpm` и `pnpm --version` заново.
