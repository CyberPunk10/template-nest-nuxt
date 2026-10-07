# scripts/

The Node scripts behind the commands in `package.json`.

```
scripts/
├── predev.mjs          before pnpm dev: .env + ports
├── predocker.mjs       before pnpm docker:up: .env + proxy port + network
├── copy-env.mjs        .env paths, copying, parseEnv
├── copy-env-cli.mjs    CLI wrapper for pnpm env:copy
├── check-ports.mjs     port availability check, dialog
├── dev-session.mjs     PID of the running pnpm dev, to stop it entirely
├── ensure-network.mjs  Docker network creation
├── log.mjs             prefix for the scripts' own messages
├── dev.mjs             runs the three applications in parallel
└── reinstall.mjs       reinstalls dependencies from scratch
```
