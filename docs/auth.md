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
- **Сессии:** каждая сессия хранится в таблице `Session` как HMAC-хэш refresh token. Logout удаляет сессию из БД

### Зачем хранить сессии в БД

JWT нельзя инвалидировать до истечения срока — это фундаментальное свойство стандарта. Если пользователь разлогинился или сменил пароль, access token всё равно остаётся валидным ещё до 15 минут.

Refresh token в БД решает эту проблему: при logout или смене пароля сессия удаляется из БД, и получить новый access token становится невозможным. Таким образом максимальное время "выживания" скомпрометированного токена ограничено временем жизни access token (15 мин).

Дополнительные возможности, которые даёт таблица `Session`:

- **Выйти со всех устройств** — удалить все сессии пользователя
- **Список активных сессий** — показать пользователю где он залогинен
- **Принудительный разлогин** — администратор может удалить сессию

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

&nbsp;

# <img src="https://nuxt.com/assets/design-kit/icon-green.svg" height="20" style="vertical-align:middle"> Фронтенд (Nuxt)
