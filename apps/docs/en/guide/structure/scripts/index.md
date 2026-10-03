# scripts/

The Node scripts behind the commands in `package.json`.

```
scripts/
├── predev.mjs          before pnpm dev: .env + ports + database
├── predocker.mjs       before pnpm docker:up: .env + proxy port + network
├── copy-env.mjs        .env paths, copying, parseEnv
├── copy-env-cli.mjs    CLI wrapper for pnpm env:copy
├── check-ports.mjs     port availability check, dialog
├── ensure-network.mjs  Docker network creation
├── log.mjs             prefix for the scripts' own messages
├── db.mjs              starts/stops the database container
├── dev.mjs             runs the three applications in parallel
└── reinstall.mjs       reinstalls dependencies from scratch
```
