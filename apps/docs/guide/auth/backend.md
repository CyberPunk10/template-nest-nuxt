# Бэкенд (NestJS <img src="https://nestjs.com/img/logo-small.svg" height="20" style="vertical-align:middle">)

## Как работает

- **Регистрация:** `POST /auth/register` — создаёт пользователя, устанавливает оба cookie
- **Вход:** `POST /auth/login` — проверяет email+пароль через bcrypt, устанавливает cookie
- **Cookies:** `access_token` (JWT, 15 мин) и `refresh_token` (7 дней) — оба httpOnly, недоступны из JS
- **Защищённые роуты:** глобальный `JwtAuthGuard` проверяет `access_token` на каждом запросе
- **Refresh:** при истечении access token фронтенд автоматически вызывает `POST /auth/refresh`. Refresh token ротируется при каждом обновлении
- **Сессии:** каждый refresh token хранится в таблице `Session` как HMAC-хэш. При каждом обновлении токена старая запись помечается `isUsed: true` и создаётся новая. Logout удаляет активную сессию из хранилища
- **Reuse detection:** если уже использованный refresh token предъявлен повторно — признак кражи токена. Все сессии семьи (`familyId`) инвалидируются

### Флаги cookie

Оба токена ставятся с одинаковым набором флагов:

```ts
{
  httpOnly: true,
  sameSite: 'strict',
  secure: isProd,     // NODE_ENV === 'production'
  path: '/',
}
```

- `httpOnly` — cookie не видна из JavaScript, поэтому XSS не даёт украсть токен.
- `sameSite: 'strict'` — браузер не отправит cookie при переходе с чужого сайта: защита от CSRF.
- `secure` включается **только** в production: по HTTP такая cookie не отправляется вовсе, и на локальной разработке без TLS вход бы просто не работал.
- `path: '/'` задан явно не для красоты — Express требует совпадения `path` при установке и удалении, иначе `clearCookie()` при логауте не удалит cookie.

Время жизни берётся из `JWT_EXPIRES_IN` и `REFRESH_TOKEN_EXPIRES_DAYS` — [переменные backend](../structure/apps/backend/env-example).

### Зачем хранить сессии

JWT нельзя инвалидировать до истечения срока — это фундаментальное свойство стандарта. Если пользователь разлогинился или сменил пароль, access token всё равно остаётся валидным ещё до 15 минут.

Хранение refresh token на сервере решает эту проблему: при logout или смене пароля сессия удаляется из хранилища, и получить новый access token становится невозможным. Таким образом максимальное время "выживания" скомпрометированного токена ограничено временем жизни access token (15 мин).

Дополнительные возможности, которые даёт таблица `Session`:

- **Выйти со всех устройств** — удалить все сессии пользователя
- **Список активных сессий** — показать пользователю где он залогинен (браузер, IP, время)
- **Принудительный разлогин** — администратор может удалить сессию

### Ротация токенов и reuse detection

При каждом `POST /auth/refresh` происходит **ротация**: старый refresh token деактивируется, выдаётся новый. Это стандарт RFC 9700 (OAuth 2.0 Security BCP).

**Как выглядит таблица `Session` для одного пользователя:**

```
| Событие                 | familyId | hash               | isUsed                            |
| ----------------------- | -------- | ------------------ | --------------------------------- |
| Логин с телефона        | f1       | "A"                | false   ← активная                |
| Refresh (телефон)       | f1       | "A"                | true    ← деактивирована          |
| f1                      | "B"      | false   ← активная |
| Refresh (телефон снова) | f1       | "B"                | true    ← деактивирована          |
| f1                      | "C"      | false   ← активная |
| Логин с ноутбука        | f2       | "D"                | false   ← активная (другая семья) |
```

В каждой семье (`familyId`) всегда ровно одна активная запись (`isUsed: false`). Записи с `isUsed: true` — это "ловушки": если кто-то предъявит старый токен, сервер их обнаружит.

**Сценарий reuse attack:**

```
Логин                  → { familyId: f1, hash: "A", isUsed: false }

Refresh (легитимный)   → { familyId: f1, hash: "A", isUsed: true  }  (старая)
                          { familyId: f1, hash: "B", isUsed: false }  (новая, активная)

Refresh (атакующий украл токен "A" и использует его повторно):
  → сервер ищет hash("A") → находит запись с isUsed: true
  → признак компрометации: удаляет все записи с familyId: f1
  → пользователь принудительно разлогинен с телефона
  → сессия ноутбука (f2) не затронута
```

Записи `isUsed: true` нужны только как ловушки, пока оригинальный токен мог бы быть жив. Cron-задача удаляет все записи у которых `expiresAt < now` — и `isUsed: true` ловушки, и активные сессии давно не заходивших пользователей (см. [Очистка истёкших сессий](#очистка-истекших-сессии)).

**`familyId`** объединяет все ротации одного входа. Благодаря этому при компрометации инвалидируется только скомпрометированная цепочка, а не все устройства пользователя одновременно.

### Почему HMAC, а не bcrypt для refresh token

bcrypt недетерминирован — каждый раз даёт разный хэш, поэтому нельзя искать сессию по хэшу напрямую. Пришлось бы перебирать все сессии в хранилище — O(n) сравнений.

HMAC детерминирован: один токен + один секрет = всегда один хэш. Это позволяет найти сессию за один запрос: `WHERE refreshTokenHash = hmac(token, secret)`.

Компромисс: если `REFRESH_TOKEN_SECRET` утечёт — все refresh tokens потенциально скомпрометированы одновременно. Mitigation: хранить секрет в защищённом хранилище (Vault, AWS Secrets Manager) и ротировать его периодически.

## Защита от email enumeration (timing attack)

При логине с несуществующим email наивная реализация возвращает ответ мгновенно — без bcrypt. Злоумышленник по времени ответа определяет, зарегистрирован ли email в системе.

Решение: `validateUser` всегда запускает `bcrypt.compare`, даже если пользователь не найден — используется `dummyHash`:

```
email найден    → bcrypt.compare(password, user.passwordHash)  ~2-100ms
email не найден → bcrypt.compare(password, dummyHash)          ~2-100ms (то же время)
```

`dummyHash` генерируется **один раз при старте** через `onModuleInit()` с текущим значением `BCRYPT_ROUNDS`. Это важно: захардкоженный хеш с фиксированным cost=12 создал бы timing разницу в тестах и staging-окружениях, где `BCRYPT_ROUNDS=4`.

## Архитектура Passport: стратегии и guards

Passport работает через два понятия: **стратегия** (как проверить пользователя) и **guard** (пускать ли его дальше).

### Стратегии

Стратегия — это класс с методом `validate()`, который отвечает на вопрос "кто этот пользователь?". Результат `validate()` Passport автоматически кладёт в `req.user`.

**`LocalStrategy`** — используется только при логине (`POST /auth/login`). Passport сам достаёт `email` и `password` из тела запроса и передаёт в `validate()`. Там происходит проверка пароля через `bcrypt.compare`. Если проверка провалилась — бросается `UnauthorizedException`.

**`JwtStrategy`** — используется на всех защищённых роутах. Passport сам достаёт `access_token` из cookie, верифицирует подпись и срок жизни, и передаёт payload (`{ sub, email }`) в `validate()`. Логику верификации токена писать не нужно — Passport делает это за вас.

### Guards

Guard решает — пускать запрос дальше или нет. Он вызывает стратегию внутри себя.

**`LocalAuthGuard`** — применяется вручную через `@UseGuards(LocalAuthGuard)` только на роуте логина. Запускает `LocalStrategy`.

**`JwtAuthGuard`** — зарегистрирован глобально через `APP_GUARD`, поэтому срабатывает на каждый входящий запрос. Логика:

1. Читает метаданные роута: есть ли `@Public()`?
2. Если да — пропускает запрос без проверки токена
3. Если нет — запускает `JwtStrategy` для проверки cookie

### Как запросы проходят через систему

**`POST /auth/login`** (роут помечен `@Public()` + `@UseGuards(LocalAuthGuard)`):

```
→ JwtAuthGuard: видит @Public() → пропускает JWT-проверку
→ LocalAuthGuard: запускает LocalStrategy
→ LocalStrategy.validate(email, password) → bcrypt.compare
→ req.user = объект пользователя без passwordHash
→ выполняется метод контроллера
```

**`GET /users`** (защищённый роут):

```
→ JwtAuthGuard: @Public() нет → запускает JwtStrategy
→ JwtStrategy: достаёт access_token из cookie → верифицирует JWT
→ req.user = { sub: userId, email }
→ выполняется метод контроллера
```

**`GET /users`** без токена:

```
→ JwtAuthGuard: @Public() нет → запускает JwtStrategy
→ JwtStrategy: cookie нет → стратегия возвращает false
→ JwtAuthGuard.handleRequest: бросает UnauthorizedException → 401
```

### `@Public()` — как работает декоратор

`@Public()` записывает метаданные прямо в класс или метод контроллера во время компиляции. `JwtAuthGuard` читает эти метаданные через `Reflector` перед каждым запросом. Это серверный механизм — клиент не может повлиять на метаданные роута, они живут в памяти процесса.

## Как открыть роут публично

По умолчанию все роуты NestJS закрыты глобальным `JwtAuthGuard`. Чтобы открыть конкретный роут:

```typescript
import { Public } from '../auth/decorators/public.decorator'

@Public()
@Get('health')
health() {
  return { status: 'ok' }
}
```

## Как работает `passthrough` в контроллере

```typescript
@Res({ passthrough: true }) res: Response
```

По умолчанию если вы инжектите `@Res()`, NestJS передаёт управление ответом полностью вам — нужно вызывать `res.send()` вручную. `passthrough: true` говорит NestJS: "я инжектирую `res` только чтобы установить cookies, а сам ответ всё равно отправляй ты". Без этого `return` из метода контроллера ничего не отправит.

## Rate limiting

Приложение защищено от брутфорса через `@nestjs/throttler`.

| ENV              | По умолчанию | Применяется к  |
| ---------------- | ------------ | -------------- |
| `THROTTLE_TTL`   | `60000` мс   | Окно подсчёта  |
| `THROTTLE_LIMIT` | `100`/min    | Всё приложение |

Лимит считается **на каждый IP отдельно**.

### Как ThrottlerGuard применяется к эндпоинтам

`ThrottlerGuard` зарегистрирован как глобальный guard через `APP_GUARD` — **каждый эндпоинт** автоматически защищён (100/min).

`@Throttle({ default: { ttl, limit } })` переопределяет лимит для конкретного эндпоинта:

```
APP_GUARD: ThrottlerGuard                                      ← 100/min на всё

POST /auth/login     @Throttle({ default: { limit: 10 } })     ← 10/min (перебор паролей)
POST /auth/register  @Throttle({ default: { limit: 10 } })     ← 10/min (массовая регистрация)
POST /auth/refresh   @Throttle({ default: { limit: 10 } })     ← 10/min (перебор токенов)
POST /auth/logout                                              ← 100/min (глобальный)
GET  /auth/me                                                  ← 100/min (глобальный)
```

Auth-эндпоинты получают более жёсткий лимит прямо в декораторе — сразу видно какой лимит и почему.

### За reverse proxy

В production приложение обычно стоит за nginx или Cloudflare. В этом случае все запросы приходят на NestJS с одного IP прокси — throttler будет считать лимит для всех пользователей как одного.

Решение — настроить `getTracker` на чтение реального IP из заголовка `X-Forwarded-For`:

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

> **Важно:** доверять `X-Forwarded-For` можно только если он проставляется вашим доверенным прокси. Если заголовок может подделать клиент — это обход rate limiting. Убедитесь что nginx/Cloudflare перезаписывает этот заголовок, а не добавляет к существующему.

### Тесты

Throttler покрыт двумя наборами e2e тестов с разными конфигурациями:

**`jest-e2e.json`** — основные auth-тесты (`test/default/`). Throttler **отключён** через `skipIf`:

```typescript
skipIf: () => config.get('APP_ENV') === 'test',
```

`APP_ENV=test` выставляется в `test/setup-e2e.ts` до загрузки модулей. Без этого тесты падали бы на 429 при создании тестовых пользователей.

**`jest-e2e-throttle.json`** — throttle-тесты (`test/throttle/`). Throttler **включён** (`APP_ENV=production`, `test/setup-e2e-throttle.ts`). Проверяют реальное поведение:

- глобальный лимит (`THROTTLE_LIMIT=12`) срабатывает на `/auth/me` — 13-й запрос возвращает 429
- локальный лимит (`limit: 10` на auth-роутах) срабатывает раньше глобального — 11-й запрос на `/auth/register` возвращает 429

```bash
pnpm test:e2e           # основные тесты (throttler выключен)
pnpm test:e2e:throttle  # throttle-тесты (throttler включён)
```

## RBAC (Role-Based Access Control) и ownership

### Роли

Пользователь имеет роль (`Role.admin` или `Role.user` — Prisma-enum, сгенерированный из `schema.prisma`), которая попадает в payload JWT при логине и доступна как `req.user.role` (см. `JwtStrategy`). По умолчанию (`@default(user)` в схеме) новый пользователь через `POST /auth/register` всегда получает `Role.user` — обычная регистрация никогда не создаёт admin.

Единственный способ завести admin-аккаунт — сид (см. [Seed: создание admin-аккаунта](#seed-создание-admin-аккаунта) ниже).

### `RolesGuard` и `@Roles()`

`RolesGuard` зарегистрирован глобально через `APP_GUARD` **после** `JwtAuthGuard` — это гарантирует, что `req.user` уже заполнен к моменту проверки роли. Guard проверяет метаданные `@Roles()` через `Reflector`; если декоратора нет — пропускает запрос без проверки роли.

```typescript
@Roles(Role.admin)
@Get()
findAll(): Promise<SafeUser[]> {
  return this.usersService.findAll()
}
```

Используется на `GET /users` и `GET /tasks/all` — оба возвращают данные всех пользователей и доступны только `admin`.

### Ownership-проверки

В отличие от ролей, доступ к конкретному ресурсу (профиль пользователя, задача) не проверяется декоратором — он завязан на владельца:

- **`UsersController`**: `assertSelf` сравнивает `id` из URL с `user.sub` из JWT и бросает `ForbiddenException`, если они не совпадают — применяется к `PUT/DELETE /users/:id`, то есть менять и удалять можно только свой профиль, независимо от роли (включая `admin`).
- **`GET /users/:id`** использует более мягкую проверку `assertSelfOrAdmin` — доступен владельцу профиля **или** любому `admin` (например, для поддержки/модерации). Это осознанная асимметрия: просмотр чужих данных — низкий риск, а изменение/удаление чужого профиля через self-service роут — риск, который лучше не давать неявно. Если нужен полноценный админский write-доступ к чужим профилям, это отдельная функциональность (например, выделенный админский эндпоинт с собственным аудитом), которую нужно добавлять явно, а не расширять `assertSelf`.
- **`TasksController`** (`PUT/DELETE /tasks/:id`): `TasksService.findOne(id, userId)` проверяет, что задача принадлежит текущему пользователю, и бросает `ForbiddenException` при несовпадении. `GET /tasks/all` (только `admin`) — единственный способ увидеть задачи всех пользователей.

## Seed: создание admin-аккаунта

### Зачем

Обычная регистрация (`POST /auth/register`) всегда создаёт пользователя с ролью `user` — это гарантия Prisma-схемы (`role Role @default(user)`), а не проверка в коде, так что её невозможно обойти опечаткой в бизнес-логике. Значит без отдельного шага в системе никогда не появится ни одного `admin`, а роуты вроде `GET /users` и `GET /tasks/all` (защищённые `@Roles(Role.admin)`) окажутся недостижимы ни для кого.

Сид (`prisma/seed.ts`) закрывает именно эту задачу: заводит один admin-аккаунт вне обычного пользовательского флоу, при подготовке окружения, а не во время работы приложения.

### Как это работает

`prisma/seed.ts` — обычный Node-скрипт, который подключается к БД напрямую (тот же `PrismaPg`-адаптер, что и `PrismaService`) и делает upsert-по-факту:

```typescript
const existing = await prisma.user.findUnique({ where: { email } })
if (existing) return // уже есть — ничего не делаем

await prisma.user.create({
  data: { name: 'Admin', email, passwordHash, role: 'admin' },
})
```

Email и пароль берутся из `ADMIN_EMAIL`/`ADMIN_PASSWORD` (см. `.env`). Если хотя бы одна из переменных не задана — сид просто печатает предупреждение и завершается без ошибки: приложение прекрасно работает и без admin-аккаунта, это не обязательный шаг.

Скрипт **идемпотентен** — повторный запуск, когда admin уже создан, не создаёт дубликат и не трогает его пароль, только печатает, что он уже есть.

### Как запустить

Ни `migrate dev`, ни `migrate reset` сид не запускают. Его выполняет `pnpm dev` — шагом подготовки перед стартом, а вручную он вызывается так:

```bash
pnpm prisma migrate reset   # пересоздать БД (если нужно)
pnpm prisma db seed         # необязательно: сид выполнит и следующий pnpm dev
```

Команда сида задаётся в `prisma.config.ts` — именно её выполняет `prisma db seed`:

```typescript
migrations: {
  path: 'prisma/migrations',
  seed: 'tsx prisma/seed.ts',
},
```

> **`tsx`** — раннер TypeScript, который рекомендует документация Prisma 7 для сида.

### Продакшен

`ADMIN_EMAIL`/`ADMIN_PASSWORD` в `.env.example` — обычные плейсхолдеры, как `JWT_SECRET`. Перед реальным использованием задайте собственные значения; после первого успешного запуска сида имеет смысл сменить пароль admin-аккаунта через обычный флоу приложения (или просто не хранить продакшен-пароль в `.env` дольше, чем нужно для самого запуска сида).

## Очистка истёкших сессий

При каждой ротации старая запись остаётся в таблице `Session` с `isUsed: true`. Если пользователь делает refresh раз в день на протяжении 7 дней — накапливается 7 записей на одну цепочку. Без очистки таблица растёт бесконечно.

`SessionCleanupService` запускает cron-задачу каждую ночь в 03:00 и удаляет все записи, у которых `expiresAt < now`:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_3AM)
async cleanupExpiredSessions() {
  await this.prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
```

Это удаляет одновременно:

- `isUsed: true` записи, чей срок истёк (ловушки больше не нужны — токен уже не предъявить)
- Активные сессии с истёкшим `expiresAt` (пользователь не заходил 7+ дней)

## ENV переменные

| Переменная                   | Описание                                                                          | По умолчанию    |
| ---------------------------- | --------------------------------------------------------------------------------- | --------------- |
| `THROTTLE_TTL`               | Окно rate limiting (мс)                                                           | `60000`         |
| `THROTTLE_LIMIT`             | Максимум запросов за окно (глобально)                                             | `100`           |
| `JWT_SECRET`                 | Секрет для подписи JWT (min 32 символа)                                           | — (обязательно) |
| `JWT_EXPIRES_IN`             | Время жизни access token                                                          | `15m`           |
| `REFRESH_TOKEN_SECRET`       | Секрет для HMAC refresh token (min 32 символа)                                    | — (обязательно) |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Время жизни refresh token (дней)                                                  | `7`             |
| `BCRYPT_ROUNDS`              | Cost-фактор bcrypt для хэширования паролей                                        | `12`            |
| `ADMIN_EMAIL`                | Email admin-аккаунта, создаётся сидом (см. [Seed](#seed-создание-admin-аккаунта)) | — (опционально) |
| `ADMIN_PASSWORD`             | Пароль admin-аккаунта, создаётся сидом                                            | — (опционально) |

## E2E тесты

**`test/default/auth.e2e-spec.ts`** — механизм авторизации (throttler отключён):

- Регистрация: создание пользователя, установка cookies, конфликт по email, валидация
- Логин: правильные и неправильные учётные данные
- `GET /auth/me`: с токеном и без
- Refresh: ротация токенов, инвалидация старого, новый токен валиден
- Reuse detection: повторное использование старого токена инвалидирует всю семью; сессии других устройств не затрагиваются
- Logout: очистка сессии в хранилище, идемпотентность, работа без токена

**`test/throttle/throttle.e2e-spec.ts`** — rate limiting (throttler включён, подробнее в разделе Rate limiting → Тесты).

```bash
pnpm test:e2e           # auth-тесты
pnpm test:e2e:throttle  # throttle-тесты
```

## Документация

- [NestJS Authentication](https://docs.nestjs.com/security/authentication) — Guards, `@Public()` паттерн, глобальный guard через `APP_GUARD`
- [NestJS Passport (recipes)](https://docs.nestjs.com/recipes/passport) — `LocalStrategy`, `JwtStrategy`, `PassportModule`
- [NestJS Guards](https://docs.nestjs.com/guards) — `canActivate`, `ExecutionContext`, `Reflector`
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators) — `SetMetadata`, как работает `@Public()`
- [@nestjs/jwt](https://github.com/nestjs/jwt) — `JwtModule.registerAsync`, `JwtService.sign()`, `JwtModuleOptions`
- [cookie-parser](https://www.npmjs.com/package/cookie-parser) — middleware для чтения cookies в Express/NestJS
- [RFC 9700 — OAuth 2.0 Security BCP](https://datatracker.ietf.org/doc/html/rfc9700) — refresh token rotation, reuse detection
- [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) — rate limiting, `ThrottlerGuard`, `@Throttle()`, `getTracker`
- [@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling) — cron-задачи, `@Cron()`, `CronExpression`
