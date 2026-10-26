# Порт занят

## Симптомы

`pnpm dev` или `pnpm docker:up` останавливается с вопросом, что делать с занятым портом:

```
Port conflict: backend=3100
What would you like to do?
  Kill existing processes and use same ports (3100, 3200, 5173)
  Abort
```

Или при прямом `docker compose up`:

```
Bind for 0.0.0.0:80 failed: port is already allocated
```

## Причина

На порту из `.env` уже что-то слушает: прошлый `pnpm dev` в другом терминале, процесс, оставшийся после закрытого терминала, или посторонняя программа.

`pnpm dev` проверяет `PORT` из `apps/backend/.env`, `apps/frontend/.env` и `apps/docs/.env`, `pnpm docker:up` — `NGINX_HOST_PORT` из корневого `.env`.

## Решение

В диалоге выберите `Kill existing processes` — [`predev.mjs`](../structure/scripts/predev) сначала остановит прошлый `pnpm dev` целиком, затем завершит остальное, что держит порт.

Если порт занят программой, которую останавливать нельзя, поменяйте порт в соответствующем `.env`.

Прямой `docker compose up` портов не проверяет — запускайте через `pnpm docker:up` или освободите порт вручную.

### Windows

Завершение процессов в диалоге работает только на macOS и Linux. На Windows найдите процесс и завершите его вручную:

```powershell
netstat -ano | findstr :3100
taskkill /PID <PID> /F
```
