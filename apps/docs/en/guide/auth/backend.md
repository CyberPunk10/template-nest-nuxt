# Backend (NestJS <img src="https://nestjs.com/img/logo-small.svg" height="20" style="vertical-align:middle">)

## How it works

- **Registration:** `POST /auth/register` — creates a user and sets both cookies
- **Login:** `POST /auth/login` — verifies email + password via bcrypt and sets the cookies
- **Cookies:** `access_token` (JWT, 15 min) and `refresh_token` (7 days) — both httpOnly, inaccessible from JS
- **Protected routes:** the global `JwtAuthGuard` verifies the `access_token` on every request
- **Refresh:** when the access token expires, the frontend automatically calls `POST /auth/refresh`. The refresh token is rotated on every renewal
- **Sessions:** each refresh token is stored in the process's memory (`SessionsStore`) as an HMAC hash. On every token renewal the old record is marked `isUsed: true` and a new one is created. Logout removes the active session from the store
- **Reuse detection:** if an already-used refresh token is presented again, that's a sign of token theft. All sessions in the family (`familyId`) are invalidated

### Cookie flags

Both tokens are set with the same flags:

```ts
{
  httpOnly: true,
  sameSite: 'strict',
  secure: isProd,     // NODE_ENV === 'production'
  path: '/',
}
```

- `httpOnly` — the cookie is invisible to JavaScript, so XSS can't steal the token.
- `sameSite: 'strict'` — the browser won't send the cookie on navigation from another site: CSRF protection.
- `secure` is enabled **only** in production: such a cookie is never sent over plain HTTP, so local development without TLS simply couldn't log in.
- `path: '/'` is set explicitly for a reason — Express requires the `path` to match between setting and clearing, otherwise `clearCookie()` on logout won't remove it.

Lifetimes come from `JWT_EXPIRES_IN` and `REFRESH_TOKEN_EXPIRES_DAYS` — [backend variables](../structure/apps/backend/env-example).

### Why store sessions at all

A JWT cannot be invalidated before it expires — that is a fundamental property of the standard. If a user logs out or changes their password, the access token remains valid for up to another 15 minutes.

Storing the refresh token server-side solves this: on logout or password change the session is removed from the store, and obtaining a new access token becomes impossible. This caps the maximum lifetime of a compromised token at the lifetime of the access token (15 min).

Additional capabilities the `SessionsStore` enables:

- **Log out everywhere** — delete all of a user's sessions
- **List active sessions** — show the user where they're logged in (browser, IP, time)
- **Forced logout** — an administrator can delete a session

### Token rotation and reuse detection

On every `POST /auth/refresh`, **rotation** happens: the old refresh token is deactivated and a new one is issued. This is the standard from RFC 9700 (OAuth 2.0 Security BCP).

**What the `SessionsStore` records look like for a single user:**

```
| Event                 | familyId | hash             | isUsed                              |
| --------------------- | -------- | ---------------- | ----------------------------------- |
| Login from phone      | f1       | "A"              | false   ← active                    |
| Refresh (phone)       | f1       | "A"              | true    ← deactivated               |
| f1                    | "B"      | false   ← active |
| Refresh (phone again) | f1       | "B"              | true    ← deactivated               |
| f1                    | "C"      | false   ← active |
| Login from laptop     | f2       | "D"              | false   ← active (different family) |
```

Within each family (`familyId`) there is always exactly one active record (`isUsed: false`). Records with `isUsed: true` are "traps": if someone presents an old token, the server will detect it.

**Reuse attack scenario:**

```
Login                  → { familyId: f1, hash: "A", isUsed: false }

Refresh (legitimate)   → { familyId: f1, hash: "A", isUsed: true  }  (old)
                          { familyId: f1, hash: "B", isUsed: false }  (new, active)

Refresh (attacker stole token "A" and reuses it):
  → server looks up hash("A") → finds a record with isUsed: true
  → sign of compromise: deletes all records with familyId: f1
  → user is forcibly logged out of the phone
  → the laptop session (f2) is untouched
```

The `isUsed: true` records are needed only as traps while the original token could still be alive. A cron job deletes all records where `expiresAt < now` — both the `isUsed: true` traps and the active sessions of users who haven't logged in for a long time (see [Cleaning up expired sessions](#cleaning-up-expired-sessions)). All of these records live only in the process's memory — the `familyId` chain does not survive a backend restart.

**`familyId`** ties together all rotations of a single login. Because of it, a compromise invalidates only the compromised chain, not all of the user's devices at once.

### Why HMAC and not bcrypt for the refresh token

bcrypt is non-deterministic — it produces a different hash every time, so you can't look up a session by hash directly. You'd have to iterate over every session in the store — O(n) comparisons.

HMAC is deterministic: one token + one secret = always the same hash. This lets you find the session by its `refreshTokenHash` value (see `SessionsStore.findByRefreshTokenHash`).

The trade-off: if `REFRESH_TOKEN_SECRET` leaks, all refresh tokens are potentially compromised at once. Mitigation: keep the secret in a secure store (Vault, AWS Secrets Manager) and rotate it periodically.

## Protection against email enumeration (timing attack)

When logging in with a nonexistent email, a naive implementation returns a response instantly — skipping bcrypt. An attacker can tell from the response time whether an email is registered in the system.

Solution: `validateUser` always runs `bcrypt.compare`, even when the user is not found — using a `dummyHash`:

```
email found     → bcrypt.compare(password, user.passwordHash)  ~2-100ms
email not found → bcrypt.compare(password, dummyHash)          ~2-100ms (same time)
```

The `dummyHash` is generated **once at startup** via `onModuleInit()` with the current value of `BCRYPT_ROUNDS`. This matters: a hardcoded hash with a fixed cost=12 would create a timing difference in tests and staging environments where `BCRYPT_ROUNDS=4`.

## Passport architecture: strategies and guards

Passport works through two concepts: a **strategy** (how to validate a user) and a **guard** (whether to let them through).

### Strategies

A strategy is a class with a `validate()` method that answers the question "who is this user?". Passport automatically places the result of `validate()` into `req.user`.

**`LocalStrategy`** — used only during login (`POST /auth/login`). Passport extracts `email` and `password` from the request body itself and passes them into `validate()`. There, the password is checked via `bcrypt.compare`. If the check fails, an `UnauthorizedException` is thrown.

**`JwtStrategy`** — used on all protected routes. Passport extracts the `access_token` from the cookie itself, verifies the signature and expiration, and passes the payload (`{ sub, email }`) into `validate()`. You don't need to write the token verification logic — Passport does it for you.

### Guards

A guard decides whether to let a request through. It invokes a strategy internally.

**`LocalAuthGuard`** — applied manually via `@UseGuards(LocalAuthGuard)` only on the login route. Runs `LocalStrategy`.

**`JwtAuthGuard`** — registered globally via `APP_GUARD`, so it fires on every incoming request. Logic:

1. Reads the route metadata: is there a `@Public()`?
2. If yes — lets the request through without checking the token
3. If no — runs `JwtStrategy` to check the cookie

### How requests flow through the system

**`POST /auth/login`** (route marked `@Public()` + `@UseGuards(LocalAuthGuard)`):

```
→ JwtAuthGuard: sees @Public() → skips the JWT check
→ LocalAuthGuard: runs LocalStrategy
→ LocalStrategy.validate(email, password) → bcrypt.compare
→ req.user = user object without passwordHash
→ the controller method runs
```

**`GET /users`** (protected route):

```
→ JwtAuthGuard: no @Public() → runs JwtStrategy
→ JwtStrategy: extracts access_token from the cookie → verifies the JWT
→ req.user = { sub: userId, email }
→ the controller method runs
```

**`GET /users`** without a token:

```
→ JwtAuthGuard: no @Public() → runs JwtStrategy
→ JwtStrategy: no cookie → the strategy returns false
→ JwtAuthGuard.handleRequest: throws UnauthorizedException → 401
```

### `@Public()` — how the decorator works

`@Public()` writes metadata directly onto the controller class or method at compile time. `JwtAuthGuard` reads this metadata via the `Reflector` before every request. This is a server-side mechanism — the client cannot influence route metadata; it lives in the process's memory.

## How to make a route public

By default all NestJS routes are locked down by the global `JwtAuthGuard`. To open up a specific route:

```typescript
import { Public } from '../auth/decorators/public.decorator'

@Public()
@Get('health')
health() {
  return { status: 'ok' }
}
```

## How `passthrough` works in the controller

```typescript
@Res({ passthrough: true }) res: Response
```

By default, if you inject `@Res()`, NestJS hands full control of the response over to you — you have to call `res.send()` manually. `passthrough: true` tells NestJS: "I'm injecting `res` only to set cookies; you still send the response yourself." Without it, a `return` from the controller method would send nothing.

## Rate limiting

The application is protected against brute force via `@nestjs/throttler`.

| ENV              | Default    | Applies to      |
| ---------------- | ---------- | --------------- |
| `THROTTLE_TTL`   | `60000` ms | Counting window |
| `THROTTLE_LIMIT` | `100`/min  | Whole app       |

The limit is counted **per IP separately**.

### How ThrottlerGuard applies to endpoints

`ThrottlerGuard` is registered as a global guard via `APP_GUARD` — **every endpoint** is automatically protected (100/min).

`@Throttle({ default: { ttl, limit } })` overrides the limit for a specific endpoint:

```
APP_GUARD: ThrottlerGuard                                      ← 100/min on everything

POST /auth/login     @Throttle({ default: { limit: 10 } })     ← 10/min (password guessing)
POST /auth/register  @Throttle({ default: { limit: 10 } })     ← 10/min (mass registration)
POST /auth/refresh   @Throttle({ default: { limit: 10 } })     ← 10/min (token guessing)
POST /auth/logout                                              ← 100/min (global)
GET  /auth/me                                                  ← 100/min (global)
```

The auth endpoints get a stricter limit right in the decorator — it's immediately clear what the limit is and why.

### Behind a reverse proxy

In production the application usually sits behind nginx or Cloudflare. In that case every request reaches NestJS from the single proxy IP — the throttler will count the limit for all users as if they were one.

The fix is to configure `getTracker` to read the real IP from the `X-Forwarded-For` header:

```typescript
ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      { name: 'default', ttl: config.get('THROTTLE_TTL'), limit: config.get('THROTTLE_LIMIT') },
    ],
    getTracker: (req) => req.headers['x-forwarded-for'] ?? req.ip,
  }),
})
```

> **Important:** you can only trust `X-Forwarded-For` if it is set by your own trusted proxy. If the header can be spoofed by the client, that's a way to bypass rate limiting. Make sure nginx/Cloudflare overwrites this header rather than appending to an existing one.

### Tests

The throttler is covered by two sets of e2e tests with different configurations:

**`jest-e2e.json`** — the main auth tests (`test/default/`). The throttler is **disabled** via `skipIf`:

```typescript
skipIf: () => config.get('APP_ENV') === 'test',
```

`APP_ENV=test` is set in `test/setup-e2e.ts` before the modules load. Without this, the tests would fail with 429 while creating test users.

**`jest-e2e-throttle.json`** — the throttle tests (`test/throttle/`). The throttler is **enabled** (`APP_ENV=production`, `test/setup-e2e-throttle.ts`). They verify the real behavior:

- the global limit (`THROTTLE_LIMIT=12`) trips on `/auth/me` — the 13th request returns 429
- the local limit (`limit: 10` on auth routes) trips before the global one — the 11th request to `/auth/register` returns 429

```bash
pnpm test:e2e           # main tests (throttler disabled)
pnpm test:e2e:throttle  # throttle tests (throttler enabled)
```

## RBAC (Role-Based Access Control) and ownership

### Roles

A user has a role (`Role.Admin` or `Role.User`), which is embedded in the JWT payload at login and available as `req.user.role` (see `JwtStrategy`).

**No-DB/no-seeds starter:** the first user ever registered is automatically granted `Role.Admin` (see `UsersService.create`) — this exists so the demo endpoints (`GET /users`, `GET /tasks/all`) work out of the box without a separate seeding step.

> **Important for production:** this is a dev convenience, not a secure bootstrap. The rule applies to *whoever* wins the first successful `POST /auth/register`, not to a specific owner — if the storage is empty (e.g. after a reset or before the first deploy), admin goes to whoever registers first. Before real use, replace this with an explicit admin seed (an environment variable, a migration, or a dedicated CLI command) rather than relying on registration order.

### `RolesGuard` and `@Roles()`

`RolesGuard` is registered globally via `APP_GUARD` **after** `JwtAuthGuard` — this guarantees `req.user` is already populated by the time the role check runs. The guard reads `@Roles()` metadata via `Reflector`; if the decorator is absent, it lets the request through without a role check.

```typescript
@Roles(Role.Admin)
@Get()
findAll(): Promise<SafeUser[]> {
  return this.usersService.findAll()
}
```

Used on `GET /users` and `GET /tasks/all` — both return data for every user and are restricted to `admin`.

### Ownership checks

Unlike roles, access to a specific resource (a user's own profile, a task) isn't checked via a decorator — it's tied to ownership:

- **`UsersController`**: `assertSelf` compares the `id` from the URL to `user.sub` from the JWT and throws `ForbiddenException` if they don't match — applied to `PUT/DELETE /users/:id`, so only the owner can update or delete a profile, regardless of role (including `admin`).
- **`GET /users/:id`** uses the looser `assertSelfOrAdmin` check — accessible to the profile owner **or** any `admin` (e.g. for support/moderation). This asymmetry is intentional: reading someone else's data is low-risk, while writing to another user's profile through a self-service route is a risk that shouldn't be granted implicitly. Full admin write-access to other users' profiles is a separate feature (e.g. a dedicated admin endpoint with its own audit trail) that has to be added explicitly, not by widening `assertSelf`.
- **`TasksController`** (`PUT/DELETE /tasks/:id`): `TasksService.findOne(id, userId)` checks that the task belongs to the current user and throws `ForbiddenException` on a mismatch. `GET /tasks/all` (admin-only) is the only way to see every user's tasks.

## Seed: creating the admin account

Ordinary registration (`POST /auth/register`) always assigns the `user` role — `UsersService.create()` passes `Role.User` explicitly. Without a separate step no `admin` would ever exist, and the routes behind `@Roles(Role.Admin)` (`GET /users`, `GET /tasks/all`) would be unreachable.

`UsersSeedService` covers that. Unlike the database branches, where the seed is a separate command, storage here is in-memory and is recreated on every start — so the admin is created in `onModuleInit`, as the application boots:

```typescript
const email = this.config.get<string>('ADMIN_EMAIL')
const password = this.config.get<string>('ADMIN_PASSWORD')
if (!email || !password) return          // not set — simply skipped

if (await this.usersService.findByEmail(normalizedEmail)) return   // already there
```

The password is hashed with `BCRYPT_ROUNDS` and the email is lowercased. A restart leaves an existing admin alone.

`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env.example` are placeholders, like `JWT_SECRET`: set your own values before real use.

## Cleaning up expired sessions

On every rotation the old record stays in `SessionsStore` with `isUsed: true`. If a user refreshes once a day for 7 days, that accumulates 7 records for a single chain. Without cleanup the Map inside `SessionsStore` grows without bound (a memory leak in the process).

`SessionCleanupService` runs a cron job every night at 03:00 and deletes all records where `expiresAt < now`:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_3AM)
async cleanupExpiredSessions(): Promise<void> {
  try {
    const { count } = await this.sessions.deleteExpired()
    if (count > 0) {
      this.logger.log(`Deleted ${count} expired sessions`)
    }
  } catch (err) {
    this.logger.error('Failed to cleanup expired sessions', err)
  }
}
```

This removes at the same time:

- `isUsed: true` records that have expired (the traps are no longer needed — the token can't be presented anymore)
- active sessions with an expired `expiresAt` (the user hasn't logged in for 7+ days)

## ENV variables

| Variable                     | Description                                      | Default      |
| ---------------------------- | ------------------------------------------------ | ------------ |
| `THROTTLE_TTL`               | Rate limiting window (ms)                        | `60000`      |
| `THROTTLE_LIMIT`             | Max requests per window (global)                 | `100`        |
| `JWT_SECRET`                 | Secret for signing JWTs (min 32 chars)           | — (required) |
| `JWT_EXPIRES_IN`             | Access token lifetime                            | `15m`        |
| `REFRESH_TOKEN_SECRET`       | Secret for the HMAC refresh token (min 32 chars) | — (required) |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token lifetime (days)                    | `7`          |
| `BCRYPT_ROUNDS`              | bcrypt cost factor for hashing passwords         | `12`         |

## E2E tests

**`test/default/auth.e2e-spec.ts`** — the authorization mechanism (throttler disabled):

- Registration: creating a user, setting cookies, email conflict, validation
- Login: correct and incorrect credentials
- `GET /auth/me`: with and without a token
- Refresh: token rotation, invalidating the old one, the new token is valid
- Reuse detection: reusing an old token invalidates the whole family; other devices' sessions are untouched
- Logout: clearing the session in the store, idempotency, working without a token

**`test/throttle/throttle.e2e-spec.ts`** — rate limiting (throttler enabled, more detail in the Rate limiting → Tests section).

```bash
pnpm test:e2e           # auth tests
pnpm test:e2e:throttle  # throttle tests
```

## Documentation

- [NestJS Authentication](https://docs.nestjs.com/security/authentication) — Guards, the `@Public()` pattern, global guard via `APP_GUARD`
- [NestJS Passport (recipes)](https://docs.nestjs.com/recipes/passport) — `LocalStrategy`, `JwtStrategy`, `PassportModule`
- [NestJS Guards](https://docs.nestjs.com/guards) — `canActivate`, `ExecutionContext`, `Reflector`
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators) — `SetMetadata`, how `@Public()` works
- [@nestjs/jwt](https://github.com/nestjs/jwt) — `JwtModule.registerAsync`, `JwtService.sign()`, `JwtModuleOptions`
- [cookie-parser](https://www.npmjs.com/package/cookie-parser) — middleware for reading cookies in Express/NestJS
- [RFC 9700 — OAuth 2.0 Security BCP](https://datatracker.ietf.org/doc/html/rfc9700) — refresh token rotation, reuse detection
- [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) — rate limiting, `ThrottlerGuard`, `@Throttle()`, `getTracker`
- [@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling) — cron jobs, `@Cron()`, `CronExpression`
