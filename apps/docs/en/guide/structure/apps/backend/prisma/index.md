# apps/backend/prisma

Everything related to the database schema and its lifecycle.

```
prisma/
├── schema.prisma           models, relations, enums
├── migrations/             history of schema changes
│   ├── 20260813204454_init/
│   └── migration_lock.toml
└── seed.ts                 filling the database with initial data
```

The directory is read by the Prisma CLI; its path is set in the backend's `prisma.config.ts`. The generated client does not land here — it is created in `src/generated/prisma/` and is not versioned.

How to use all of this — migrations, client generation, seeding — is covered in [Database](/en/guide/database/).
