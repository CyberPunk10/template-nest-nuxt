# ensure-network.mjs

Экспортирует одну функцию — `ensureNetwork()`. Читает `COMPOSE_NETWORK_NAME` из корневого `.env` и создаёт docker сеть, если её ещё нет. Повторные вызовы ничего не делают.

Переменная обязательна: без неё функция бросает ошибку:

```
WARN[0000] The "COMPOSE_NETWORK_NAME" variable is not set. Defaulting to a blank string.
network  declared as external, but could not be found.
```

Вызывается из [`predocker.mjs`](/guide/structure/scripts/predocker) — перед `pnpm docker:up`.

## Использование

Своей pnpm-команды нет — вызывается из [`predocker.mjs`](/guide/structure/scripts/predocker), то есть срабатывает при `pnpm docker:up`:

```js
import { ensureNetwork } from './ensure-network.mjs'

const { name, created } = ensureNetwork()   // created: true — сеть создана, false — уже была
```

Docker сеть можно создать вручную без этого скрипта:

```bash
docker network create template-nest-nuxt_app
```
