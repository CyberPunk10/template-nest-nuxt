# Авторизация

[← Главная](../README.md)

> **Ветка:** эта документация актуальна только для ветки `auth`.

Шаблон использует JWT-авторизацию через Passport.js с httpOnly cookies и сессиями в PostgreSQL.

&nbsp;

# <img src="https://nestjs.com/img/logo-small.svg" height="20" style="vertical-align:middle"> Бэкенд (NestJS)

## Как работает

- **Регистрация:** `POST /auth/register` — создаёт пользователя, устанавливает оба cookie
- **Вход:** `POST /auth/login` — проверяет email+пароль через bcrypt, устанавливает cookie
- **Cookies:** `access_token` (JWT, 15 мин) и `refresh_token` (7 дней) — оба httpOnly, недоступны из JS
- **Защищённые роуты:** глобальный `JwtAuthGuard` проверяет `access_token` на каждом запросе
- **Refresh:** при истечении access token фронтенд автоматически вызывает `POST /auth/refresh`. Refresh token ротируется при каждом обновлении
- **Сессии:** каждый refresh token хранится в таблице `Session` как HMAC-хэш. При каждом обновлении токена старая запись помечается `isUsed: true` и создаётся новая. Logout удаляет активную сессию из БД
- **Reuse detection:** если уже использованный refresh token предъявлен повторно — признак кражи токена. Все сессии семьи (`familyId`) инвалидируются

### Зачем хранить сессии в БД

JWT нельзя инвалидировать до истечения срока — это фундаментальное свойство стандарта. Если пользователь разлогинился или сменил пароль, access token всё равно остаётся валидным ещё до 15 минут.

Refresh token в БД решает эту проблему: при logout или смене пароля сессия удаляется из БД, и получить новый access token становится невозможным. Таким образом максимальное время "выживания" скомпрометированного токена ограничено временем жизни access token (15 мин).

Дополнительные возможности, которые даёт таблица `Session`:

- **Выйти со всех устройств** — удалить все сессии пользователя
- **Список активных сессий** — показать пользователю где он залогинен (браузер, IP, время)
- **Принудительный разлогин** — администратор может удалить сессию

### Ротация токенов и reuse detection

При каждом `POST /auth/refresh` происходит **ротация**: старый refresh token деактивируется, выдаётся новый. Это стандарт RFC 9700 (OAuth 2.0 Security BCP).

**Как выглядит таблица `Session` для одного пользователя:**

```
Событие                  | familyId | hash  | isUsed
-------------------------|----------|-------|-------
Логин с телефона         | f1       | "A"   | false   ← активная
Refresh (телефон)        | f1       | "A"   | true    ← деактивирована
                         | f1       | "B"   | false   ← активная
Refresh (телефон снова)  | f1       | "B"   | true    ← деактивирована
                         | f1       | "C"   | false   ← активная
Логин с ноутбука         | f2       | "D"   | false   ← активная (другая семья)
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

Записи `isUsed: true` нужны только как ловушки, пока оригинальный токен мог бы быть жив. Они удаляются автоматически cron-задачей при истечении `expiresAt` (см. [Очистка истёкших сессий](#очистка-истёкших-сессий)).

**`familyId`** объединяет все ротации одного входа. Благодаря этому при компрометации инвалидируется только скомпрометированная цепочка, а не все устройства пользователя одновременно.

### Почему HMAC, а не bcrypt для refresh token

bcrypt недетерминирован — каждый раз даёт разный хэш, поэтому нельзя искать сессию в БД по хэшу напрямую. Пришлось бы загружать все сессии и перебирать — O(n) запросов.

HMAC детерминирован: один токен + один секрет = всегда один хэш. Это позволяет найти сессию за один запрос: `WHERE refreshTokenHash = hmac(token, secret)`.

Компромисс: если `REFRESH_TOKEN_SECRET` утечёт — все refresh tokens потенциально скомпрометированы одновременно. Mitigation: хранить секрет в защищённом хранилище (Vault, AWS Secrets Manager) и ротировать его периодически.

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

## Rate limiting

Приложение защищено от брутфорса через `@nestjs/throttler`:

| Область        | Лимит              | Ответ при превышении    |
| -------------- | ------------------ | ----------------------- |
| Всё приложение | 100 запросов / мин | `429 Too Many Requests` |
| `/auth/*`      | 10 запросов / мин  | `429 Too Many Requests` |

Лимит считается **на каждый IP отдельно** — 200 пользователей не делят одни 10 попыток, у каждого свои.

### За reverse proxy

В production приложение обычно стоит за nginx или Cloudflare. В этом случае все запросы приходят на NestJS с одного IP прокси — throttler будет считать лимит для всех пользователей как одного.

Решение — настроить `getTracker` на чтение реального IP из заголовка `X-Forwarded-For`:

```typescript
ThrottlerModule.forRoot({
  throttlers: [{ ttl: 60_000, limit: 100 }],
  getTracker: (req) => req.headers['x-forwarded-for'] ?? req.ip,
})
```

> **Важно:** доверять `X-Forwarded-For` можно только если он проставляется вашим доверенным прокси. Если заголовок может подделать клиент — это обход rate limiting. Убедитесь что nginx/Cloudflare перезаписывает этот заголовок, а не добавляет к существующему.

## ENV переменные

| Переменная                   | Описание                                       | По умолчанию    |
| ---------------------------- | ---------------------------------------------- | --------------- |
| `JWT_SECRET`                 | Секрет для подписи JWT (min 32 символа)        | — (обязательно) |
| `JWT_EXPIRES_IN`             | Время жизни access token                       | `15m`           |
| `REFRESH_TOKEN_SECRET`       | Секрет для HMAC refresh token (min 32 символа) | — (обязательно) |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Время жизни refresh token (дней)               | `7`             |

## Документация

- [NestJS Authentication](https://docs.nestjs.com/security/authentication) — Guards, `@Public()` паттерн, глобальный guard через `APP_GUARD`
- [NestJS Passport (recipes)](https://docs.nestjs.com/recipes/passport) — `LocalStrategy`, `JwtStrategy`, `PassportModule`
- [NestJS Guards](https://docs.nestjs.com/guards) — `canActivate`, `ExecutionContext`, `Reflector`
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators) — `SetMetadata`, как работает `@Public()`
- [@nestjs/jwt](https://github.com/nestjs/jwt) — `JwtModule.registerAsync`, `JwtService.sign()`, `JwtModuleOptions`
- [cookie-parser](https://www.npmjs.com/package/cookie-parser) — middleware для чтения cookies в Express/NestJS
- [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) — rate limiting, `ThrottlerGuard`, `@Throttle()`, `getTracker`
- [@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling) — cron-задачи, `@Cron()`, `CronExpression`

&nbsp;

# <img src="https://nuxt.com/assets/design-kit/icon-green.svg" height="20" style="vertical-align:middle"> Фронтенд (Nuxt)
