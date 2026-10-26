# Port in use

## Symptoms

`pnpm dev` or `pnpm docker:up` stops and asks what to do with the busy port:

```
Port conflict: backend=3100
What would you like to do?
  Kill existing processes and use same ports (3100, 3200, 5173)
  Abort
```

Or with a direct `docker compose up`:

```
Bind for 0.0.0.0:80 failed: port is already allocated
```

## Cause

Something is already listening on the port from `.env`: a previous `pnpm dev` in another terminal, a process left over after a closed terminal, or an unrelated program.

`pnpm dev` checks `PORT` from `apps/backend/.env`, `apps/frontend/.env` and `apps/docs/.env`; `pnpm docker:up` checks `NGINX_HOST_PORT` from the root `.env`.

## Fix

Pick `Kill existing processes` in the dialog — [`predev.mjs`](../structure/scripts/predev) first stops the previous `pnpm dev` as a whole, then terminates whatever else holds the port.

If the port is taken by a program you can't stop, change the port in the corresponding `.env`.

A direct `docker compose up` doesn't check ports — run it via `pnpm docker:up` or free the port manually.

### Windows

Terminating processes from the dialog works only on macOS and Linux. On Windows, find the process and terminate it manually:

```powershell
netstat -ano | findstr :3100
taskkill /PID <PID> /F
```
