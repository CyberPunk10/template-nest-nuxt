# ensure-network.mjs

Экспортирует одну функцию — `ensureNetwork()`. Читает `COMPOSE_NETWORK_NAME` из корневого `.env` и создаёт docker сеть, если её ещё нет. Повторные вызовы ничего не делают.

Переменная обязательна: без неё функция бросает ошибку:

```
WARN[0000] The "COMPOSE_NETWORK_NAME" variable is not set. Defaulting to a blank string.
network  declared as external, but could not be found.
```

Вызывается из [`predocker.mjs`](./predocker) — перед `pnpm docker:up`, и из [`db.mjs`](./db) — перед запуском БД.

## Использование

Своей pnpm-команды нет — срабатывает при `pnpm docker:up` и при `pnpm db:up` (в том числе внутри `pnpm dev`):

```js
import { ensureNetwork } from './ensure-network.mjs'

const { name, created } = ensureNetwork()   // created: true — сеть создана, false — уже была
```

Docker сеть можно создать вручную без этого скрипта:

```bash
docker network create template-nest-nuxt_app
```
