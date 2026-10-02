# infra/

Infrastructure that isn't an application.

```
infra/
└── nginx/
    ├── nginx.conf.template
    └── Dockerfile
```

Right now that's just the reverse proxy. It sits outside `apps/` because it serves the whole stack rather than one particular application: it hands out the documentation, proxies Swagger and forwards everything else to the frontend.

What's inside — [nginx](./nginx/).
