import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'
import { setupApp } from '../../src/setup-app'
import { SessionsStore } from '../../src/modules/auth/sessions.store'
import { UsersService } from '../../src/modules/users/users.service'

describe('Auth throttle (e2e)', () => {
  let app: INestApplication<App>
  let sessions: SessionsStore
  let users: UsersService

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    // Тот же setup, что и в main.ts — см. setup-app.ts
    app = setupApp(moduleFixture.createNestApplication())
    await app.init()
    sessions = moduleFixture.get(SessionsStore)
    users = moduleFixture.get(UsersService)
  })

  const TEST_EMAILS = Array.from({ length: 10 }, (_, i) => `throttle${i}@example.com`).concat([
    'throttle_final@example.com',
  ])

  async function cleanupTestData() {
    await sessions.clear()
    await users.removeByEmails(TEST_EMAILS)
  }

  beforeEach(async () => {
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('GET /auth/me throttle-ится глобальным лимитом (THROTTLE_LIMIT=12)', async () => {
    // Исчерпываем глобальный лимит через /auth/me — 13-й запрос должен вернуть 429.
    for (let i = 0; i < 12; i++) {
      const res = await request(app.getHttpServer()).get('/auth/me')
      expect(res.status).toBe(401)
    }
    const res = await request(app.getHttpServer()).get('/auth/me')
    expect(res.status).toBe(429)
  })

  it('возвращает 429 после превышения лимита auth-роута (10/min)', async () => {
    // Auth-роуты имеют лимит 10/min через @Throttle({ default: { limit: 10 } }).
    // Делаем 10 успешных запросов, 11-й должен вернуть 429.
    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: `throttle${i}@example.com`, password: 'password123' })
      expect(res.status).toBe(201)
    }

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Test', email: 'throttle_final@example.com', password: 'password123' })
    expect(res.status).toBe(429)
  })
})
