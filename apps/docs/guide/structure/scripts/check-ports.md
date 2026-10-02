# check-ports.mjs

Общий модуль с утилитами для работы с портами:

- `isPortFree(port)` — проверяет, свободен ли порт на `127.0.0.1`
- `killPort(port)` — завершает процесс, занявший порт (через `lsof`/`kill`, только macOS/Linux)
- `requirePort(envPath, key)` — читает обязательную переменную порта из `.env`, при отсутствии или некорректном значении бросает понятную ошибку с указанием файла
- `checkPorts(services)` — проверяет список сервисов (`{ name, envPath, key }`), при конфликте показывает диалог с предложением убить занявшие процессы или прервать запуск

[`predev.mjs`](./predev) и [`predocker.mjs`](./predocker) используют одну и ту же `checkPorts()`, передавая ей разный список сервисов.

## Использование

Своей pnpm-команды нет — модуль импортируют другие скрипты:

```js
import { checkPorts } from './check-ports.mjs'
import { BACKEND_ENV, FRONTEND_ENV } from './copy-env.mjs'

await checkPorts([
  { name: 'backend', envPath: BACKEND_ENV, key: 'PORT' },
  { name: 'frontend', envPath: FRONTEND_ENV, key: 'PORT' },
])
```

Если все порты свободны — функция молча завершается. Если нет — показывает диалог со списком занятых.

Отдельные утилиты доступны и сами по себе:

```js
import { isPortFree, killPort, requirePort } from './check-ports.mjs'

const port = requirePort(BACKEND_ENV, 'PORT')   // 3100, или ошибка
if (!await isPortFree(port)) killPort(port)
```
