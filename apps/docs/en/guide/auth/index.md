# Authentication

> **Branches:** `auth-session` (in-memory sessions) and `postgres-prisma` (same sessions, but stored in PostgreSQL via Prisma). The auth scheme is identical in both — only the storage differs.

&nbsp;

## Choosing the approach

### Why JWT access + refresh in HttpOnly cookies

There are various architectural approaches to authentication. We chose **a JWT access token (15 min) + a refresh token with server-side rotation (in-memory)**.

| Approach                                            | When it fits                                                     | Why we didn't choose it                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Session cookie** (nuxt-auth-utils, iron-session)  | Monolith, simple app, no need for logout across all devices      | Can't revoke a session instantly, no device history, no reuse detection      |
| **Pure stateless JWT**                              | Microservices, service-to-service, very short TTL                | A JWT can't be invalidated — a stolen token is valid until it expires        |
| **Managed auth** (Clerk, Auth0)                     | Startup, no data-storage requirements                            | External dependency, data goes to a third party, cost at scale               |
| **OAuth / OIDC** (Keycloak, Google)                 | B2B SaaS, corporate SSO                                          | Overkill for a template; can be added on top of the current solution         |
| **JWT access + refresh on the server** ← our choice | Nuxt/Next + a separate API, full security needed                 | —                                                                            |

### Why not stateless JWT

A stateless JWT doesn't require a session-store lookup on every request — the token is self-contained. But it has a fundamental limitation: **the token can't be invalidated early**. If the token is stolen or the user changed their password — the token stays valid until its TTL expires.

The only workaround is a blacklist in Redis, which effectively makes the JWT stateful, only more complex.

### Why not a session cookie

A session cookie (the whole session encrypted in the cookie, no server-side store) is a simple solution, but it doesn't provide:

- Forced logout: you can't "revoke" a cookie already held by the client
- Device history: there's no session registry — nothing to show
- Reuse detection: without a server-side record it's impossible to detect token reuse

### Our choice: a hybrid

```
access_token  (JWT, 15 min)          — verified without a store lookup on every request
refresh_token (server-side, 7 days)  — refreshes the access_token, full control over the session
```

This is the **de facto standard** for web apps with a separate backend: a balance between performance (a session-store lookup only once every 15 minutes) and security (a refresh can be revoked instantly, reuse detection, session history).

### Difference from the microservices approach

In a microservices architecture JWT is used differently:

```
Browser → API Gateway → Service A (orders)
                      → Service B (payments)
                      → Service C (notifications)
```

The gateway verifies the JWT once at the entry point, and each service receives an already-verified request. The refresh token lives in a centralized Auth Service. The services don't touch sessions at all — it's not their responsibility.

We have a single backend that manages both access and refresh tokens itself. That's the right fit for a monolith — porting the microservices pattern here would be overkill.

&nbsp;

## Why not "Nuxt only"

Most Nuxt applications work fine without a separate backend: Nitro serves the API itself, and authentication is handled by [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) with a sealed session cookie. That's simpler — one codebase, one deployment, and SSR is trivial (the server already knows the user, nothing needs forwarding).

**Why this template differs:** NestJS owns users, passwords and sessions here. `nuxt-auth-utils` assumes Nitro itself owns the session ("This module only works with a Nuxt server running as it uses server API routes"). Combining them would mean keeping the session in two places — Nitro and NestJS — that is, two sources of truth.

Which approach fits when:

| Scenario                                          | Session owner                          |
| ------------------------------------------------- | -------------------------------------- |
| Fullstack Nuxt, DB accessed straight from Nitro   | **Nitro** — `nuxt-auth-utils` is ideal |
| External OAuth, data behind an API Gateway        | **Nitro** stores the provider token    |
| Managed provider (Auth0, Keycloak, Supabase)      | **the provider**, Nitro just stores it |
| Own backend with users ← **our case**             | **the backend** (NestJS)               |

A separate backend pays off when you need: multiple clients (web + mobile app + partner API), split frontend/backend teams, server-side infrastructure (cron, queues, WebSocket, gRPC), or structure for a large codebase (modules, DI, guards).

**The cost of this choice** is exactly the complexity described in [Frontend](./frontend) and [Backend](./backend): forwarding cookies across two hops during SSR, silent refresh before render, deduplicating parallel refreshes. All of it follows from the session owner and the renderer being separate processes.
