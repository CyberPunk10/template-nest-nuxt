import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'
import { setupApp } from '../../src/setup-app'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../src/modules/prisma/prisma.service'

// supertest типизирует headers как Record<string, string>, но set-cookie —
// массив строк. Приводим через unknown и нормализуем вручную.
function normalizeCookies(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as string[]
  return String(raw).split('\n').filter(Boolean)
}

function getCookie(raw: unknown, name: string): string | undefined {
  return normalizeCookies(raw)
    .find(h => h.startsWith(`${name}=`))
    ?.split(';')[0]
}

// Собирает обе куки для заголовка Cookie следующего запроса.
function buildCookieHeader(raw: unknown): string {
  return [getCookie(raw, 'access_token'), getCookie(raw, 'refresh_token')]
    .filter(Boolean)
    .join('; ')
}

// Только refresh_token из Set-Cookie заголовка ответа.
function refreshCookieOnly(raw: unknown): string {
  return getCookie(raw, 'refresh_token') ?? ''
}

// Извлекает refresh_token из уже собранного Cookie-заголовка запроса ("k=v; k2=v2").
function extractRefreshFromHeader(cookieHeader: string): string {
  return cookieHeader.split('; ').find(c => c.startsWith('refresh_token=')) ?? ''
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    // Пайпы, фильтр и cookie-parser берём из той же функции, что и main.ts —
    // иначе тесты проверяли бы приложение с другой конфигурацией, чем production.
    app = setupApp(moduleFixture.createNestApplication())

    await app.init()
    prisma = moduleFixture.get(PrismaService)
  })

  // Email-адреса, используемые в тестах — удаляем только их
  const TEST_EMAILS = ['test@example.com', 'other@example.com', 'admin-test@example.com']

  async function cleanupTestData() {
    await prisma.session.deleteMany({ where: { user: { email: { in: TEST_EMAILS } } } })
    await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } })
  }

  // Создаёт admin-пользователя напрямую в БД (минуя обычную регистрацию, которая
  // всегда выдаёт role: user) и логинится, чтобы получить куки с role: admin в JWT.
  async function createAdminCookies(): Promise<string> {
    const email = 'admin-test@example.com'
    const password = 'password123'
    const passwordHash = await bcrypt.hash(password, 4)
    await prisma.user.create({ data: { name: 'Admin', email, passwordHash, role: 'admin' } })

    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password })
    return buildCookieHeader(res.headers['set-cookie'])
  }

  afterAll(async () => {
    delete process.env.THROTTLE_LIMIT
    await cleanupTestData()
    await app.close()
  })

  beforeEach(async () => {
    await cleanupTestData()
  })

  // ─── Вспомогательные функции ────────────────────────────────────────────────

  const DEFAULT_USER = { name: 'Test User', email: 'test@example.com', password: 'password123' }

  async function registerRequest(overrides?: Partial<typeof DEFAULT_USER>) {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...DEFAULT_USER, ...overrides })
  }

  async function loginCookies(): Promise<string> {
    const res = await registerRequest()
    expect(res.status).toBe(201)
    return buildCookieHeader(res.headers['set-cookie'])
  }

  // ─── Register ───────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('создаёт пользователя и устанавливает обе куки', async () => {
      const res = await registerRequest()

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ email: 'test@example.com', name: 'Test User' })
      expect(res.body.passwordHash).toBeUndefined()

      const raw = res.headers['set-cookie']
      expect(getCookie(raw, 'access_token')).toBeDefined()
      expect(getCookie(raw, 'refresh_token')).toBeDefined()
    })

    it('возвращает 409 при повторном email', async () => {
      await registerRequest()
      const res = await registerRequest()
      expect(res.status).toBe(409)
    })

    it('возвращает 400 при невалидных данных', async () => {
      const res = await registerRequest({ email: 'not-an-email', password: '123' })
      expect(res.status).toBe(400)
    })

    it('возвращает 400 для пароля из многобайтовых символов длиннее 72 байт UTF-8', async () => {
      // 30 эмодзи по 4 байта = 120 байт, но 30 символов по .length — уложился бы
      // в MaxLength(72), но не в реальный bcrypt-лимит на 72 байта.
      const password = '😀'.repeat(30)
      const res = await registerRequest({ password })
      expect(res.status).toBe(400)
    })
  })

  // ─── Login ──────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('выдаёт куки при правильных учётных данных', async () => {
      await registerRequest()

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(res.status).toBe(200)
      const raw = res.headers['set-cookie']
      expect(getCookie(raw, 'access_token')).toBeDefined()
      expect(getCookie(raw, 'refresh_token')).toBeDefined()
    })

    it('возвращает 401 при неверном пароле', async () => {
      await registerRequest()
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
      expect(res.status).toBe(401)
    })

    it('возвращает 401 при несуществующем email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
      expect(res.status).toBe(401)
    })
  })

  // ─── Me ─────────────────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('возвращает данные пользователя с валидной кукой', async () => {
      const cookies = await loginCookies()
      const res = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookies)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ email: 'test@example.com', name: 'Test User' })
      expect(res.body.passwordHash).toBeUndefined()
    })

    it('возвращает 401 без куки', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me')
      expect(res.status).toBe(401)
    })
  })

  // ─── Refresh ────────────────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('выдаёт новые куки и старый refresh_token перестаёт работать', async () => {
      const originalCookies = await loginCookies()

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', originalCookies)
      expect(refreshRes.status).toBe(200)

      const newCookies = buildCookieHeader(refreshRes.headers['set-cookie'])
      expect(newCookies).toBeTruthy()

      // Старый refresh_token инвалидирован — шлём только его, без нового access_token
      const reuseRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', extractRefreshFromHeader(originalCookies))
      expect(reuseRes.status).toBe(401)

      // Новый refresh_token работает
      const meRes = await request(app.getHttpServer()).get('/auth/me').set('Cookie', newCookies)
      expect(meRes.status).toBe(200)
    })

    it('возвращает 401 без куки', async () => {
      const res = await request(app.getHttpServer()).post('/auth/refresh')
      expect(res.status).toBe(401)
    })

    it('возвращает 401 с несуществующим токеном', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refresh_token=fake-token-that-does-not-exist')
      expect(res.status).toBe(401)
    })

    it('возвращает 401 с просроченным токеном', async () => {
      const originalCookies = await loginCookies()

      // Переводим expiresAt сессии в прошлое напрямую в БД. where обязателен:
      // без него просрочиваются все сессии в базе, включая чужие.
      await prisma.session.updateMany({
        where: { user: { email: DEFAULT_USER.email } },
        data: { expiresAt: new Date(0) },
      })

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', extractRefreshFromHeader(originalCookies))
      expect(res.status).toBe(401)
    })

    it('новый access_token валиден после refresh', async () => {
      const originalCookies = await loginCookies()

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', originalCookies)

      const newCookies = buildCookieHeader(refreshRes.headers['set-cookie'])
      const meRes = await request(app.getHttpServer()).get('/auth/me').set('Cookie', newCookies)
      expect(meRes.status).toBe(200)
    })
  })

  // ─── Reuse detection ────────────────────────────────────────────────────────

  describe('Reuse detection', () => {
    it('повторное использование старого токена инвалидирует всю семью', async () => {
      const originalCookies = await loginCookies()
      // originalCookies — уже собранная строка "access_token=...; refresh_token=..."
      const originalRefresh = extractRefreshFromHeader(originalCookies)

      // Легитимный refresh — получаем новые куки
      const firstRefreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', originalRefresh)
      expect(firstRefreshRes.status).toBe(200)
      // refreshCookieOnly читает из set-cookie заголовка ответа (массив)
      const newRefreshCookie = refreshCookieOnly(firstRefreshRes.headers['set-cookie'])

      // Атакующий предъявляет СТАРЫЙ refresh_token — reuse detection
      const attackRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', originalRefresh)
      expect(attackRes.status).toBe(401)

      // Новый refresh_token тоже инвалидирован — вся семья удалена
      const newRefreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', newRefreshCookie)
      expect(newRefreshRes.status).toBe(401)
    })

    it('reuse detection не затрагивает сессии других устройств', async () => {
      // Устройство 1: регистрация — семья f1
      const device1Res = await registerRequest()
      // refreshCookieOnly читает из set-cookie заголовка ответа (массив)
      const device1RefreshCookie = refreshCookieOnly(device1Res.headers['set-cookie'])

      // Устройство 2: логин с того же аккаунта — отдельная семья f2
      const device2Res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
      const device2Cookies = buildCookieHeader(device2Res.headers['set-cookie'])

      // Устройство 1 делает легитимный refresh
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', device1RefreshCookie)
      expect(refreshRes.status).toBe(200)

      // Reuse attack: старый refresh_token устройства 1 — инвалидирует только семью f1
      await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', device1RefreshCookie)

      // Устройство 2 (семья f2) не пострадало — access_token ещё валиден
      const device2MeRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', device2Cookies)
      expect(device2MeRes.status).toBe(200)

      // access_token устройства 1 — JWT, криптографически ещё валиден (15 мин не прошло).
      // /auth/me вернёт 200: JWT нельзя инвалидировать до TTL — это ожидаемое поведение.
      // Именно поэтому access_token короткий (15 мин), а контроль сессий через refresh в БД.
      const device1AccessCookie = getCookie(device1Res.headers['set-cookie'], 'access_token') ?? ''
      const device1MeRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', device1AccessCookie)
      expect(device1MeRes.status).toBe(200)
    })
  })

  // ─── Logout ─────────────────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('очищает куки и сессия удаляется из БД', async () => {
      const regRes = await request(app.getHttpServer()).post('/auth/register').send(DEFAULT_USER)
      expect(regRes.status).toBe(201)
      const userId = regRes.body.id
      const cookies = buildCookieHeader(regRes.headers['set-cookie'])

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies)
      expect(logoutRes.status).toBe(200)

      // После logout refresh_token не работает
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', extractRefreshFromHeader(cookies))
      expect(refreshRes.status).toBe(401)

      // Сессий этого пользователя в БД не осталось
      const sessions = await prisma.session.findMany({ where: { userId } })
      expect(sessions).toHaveLength(0)
    })

    it('идемпотентен — повторный logout не бросает ошибку', async () => {
      const cookies = await loginCookies()

      await request(app.getHttpServer()).post('/auth/logout').set('Cookie', cookies)
      const res = await request(app.getHttpServer()).post('/auth/logout').set('Cookie', cookies)
      expect(res.status).toBe(200)
    })

    it('работает без куки (пользователь уже разлогинен)', async () => {
      const res = await request(app.getHttpServer()).post('/auth/logout')
      expect(res.status).toBe(200)
    })
  })

  // ─── Users CRUD ─────────────────────────────────────────────────────────────

  describe('Users (e2e)', () => {
    it('GET /users возвращает 200 и не содержит passwordHash', async () => {
      // GET /users — admin-only (@Roles(Role.admin))
      const cookies = await createAdminCookies()

      const res = await request(app.getHttpServer()).get('/users').set('Cookie', cookies)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      for (const user of res.body) {
        expect(user.passwordHash).toBeUndefined()
      }
    })

    it('GET /users/:id возвращает 200 и не содержит passwordHash', async () => {
      const regRes = await registerRequest()
      const cookies = buildCookieHeader(regRes.headers['set-cookie'])
      const userId = regRes.body.id

      const res = await request(app.getHttpServer()).get(`/users/${userId}`).set('Cookie', cookies)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(userId)
      expect(res.body.passwordHash).toBeUndefined()
    })

    it('GET /users возвращает 401 без авторизации', async () => {
      const res = await request(app.getHttpServer()).get('/users')
      expect(res.status).toBe(401)
    })

    it('GET /users/:id возвращает 401 без авторизации', async () => {
      const res = await request(app.getHttpServer()).get('/users/some-id')
      expect(res.status).toBe(401)
    })

    it('PUT /users/:id возвращает 401 без авторизации', async () => {
      const res = await request(app.getHttpServer()).put('/users/some-id').send({ name: 'Hacker' })
      expect(res.status).toBe(401)
    })

    it('DELETE /users/:id возвращает 401 без авторизации', async () => {
      const res = await request(app.getHttpServer()).delete('/users/some-id')
      expect(res.status).toBe(401)
    })

    it('PUT /users/:id возвращает 409 при duplicate email', async () => {
      await registerRequest({ email: 'test@example.com' })

      const resBob = await registerRequest({
        name: 'Bob',
        email: 'other@example.com',
        password: 'password123',
      })
      const bobCookies = buildCookieHeader(resBob.headers['set-cookie'])
      const bobId = resBob.body.id

      const res = await request(app.getHttpServer())
        .put(`/users/${bobId}`)
        .set('Cookie', bobCookies)
        .send({ email: 'test@example.com' })

      expect(res.status).toBe(409)
    })

    describe('доступ к чужому профилю', () => {
      it('обычный пользователь получает 403 на GET /users/:id чужого профиля', async () => {
        const resAlice = await registerRequest({ email: 'test@example.com' })
        const aliceId = resAlice.body.id
        const resBob = await registerRequest({
          name: 'Bob',
          email: 'other@example.com',
          password: 'password123',
        })
        const bobCookies = buildCookieHeader(resBob.headers['set-cookie'])

        const res = await request(app.getHttpServer())
          .get(`/users/${aliceId}`)
          .set('Cookie', bobCookies)

        expect(res.status).toBe(403)
      })

      it('admin получает 200 на GET /users/:id чужого профиля', async () => {
        const adminCookies = await createAdminCookies()
        const resBob = await registerRequest({
          name: 'Bob',
          email: 'other@example.com',
          password: 'password123',
        })
        const bobId = resBob.body.id

        const res = await request(app.getHttpServer())
          .get(`/users/${bobId}`)
          .set('Cookie', adminCookies)

        expect(res.status).toBe(200)
        expect(res.body.id).toBe(bobId)
      })

      it('admin получает 403 на PUT /users/:id чужого профиля', async () => {
        const adminCookies = await createAdminCookies()
        const resBob = await registerRequest({
          name: 'Bob',
          email: 'other@example.com',
          password: 'password123',
        })
        const bobId = resBob.body.id

        const res = await request(app.getHttpServer())
          .put(`/users/${bobId}`)
          .set('Cookie', adminCookies)
          .send({ name: 'Renamed by admin' })

        expect(res.status).toBe(403)
      })

      it('admin получает 403 на DELETE /users/:id чужого профиля', async () => {
        const adminCookies = await createAdminCookies()
        const resBob = await registerRequest({
          name: 'Bob',
          email: 'other@example.com',
          password: 'password123',
        })
        const bobId = resBob.body.id

        const res = await request(app.getHttpServer())
          .delete(`/users/${bobId}`)
          .set('Cookie', adminCookies)

        expect(res.status).toBe(403)
      })
    })
  })
})
