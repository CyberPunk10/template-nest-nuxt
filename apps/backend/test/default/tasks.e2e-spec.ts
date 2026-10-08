import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'
import { setupApp } from '../../src/setup-app'

describe('TasksController (e2e)', () => {
  let app: INestApplication<App>
  let cookies: string

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    // Пайпы и фильтр берём из той же функции, что и main.ts — иначе тесты
    // проверяли бы приложение с другой конфигурацией, чем production.
    app = setupApp(moduleFixture.createNestApplication())

    await app.init()

    // /tasks закрыт JwtAuthGuard: регистрируем пользователя и переиспользуем
    // выданные куки во всех запросах теста.
    const auth = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Tasks Tester', email: 'tasks-e2e@example.com', password: 'password123' })
      .expect(201)

    // supertest типизирует headers как Record<string, string>, но set-cookie —
    // массив строк. Берём из каждой только пару «имя=значение», без атрибутов.
    const raw = auth.headers['set-cookie'] as unknown as string[]
    cookies = raw.map(c => c.split(';')[0]).join('; ')
  })

  // Задачи лежат в памяти сервиса, поэтому приложение поднимается заново
  // перед каждым тестом — иначе они протекают между тестами.
  afterEach(async () => {
    await app.close()
  })

  // Обёртки над supertest: подставляют куки авторизации в каждый запрос.
  const create = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/tasks').set('Cookie', cookies).send(body)

  const getTasks = () => request(app.getHttpServer()).get('/tasks').set('Cookie', cookies)

  const putTask = (id: string) =>
    request(app.getHttpServer()).put(`/tasks/${id}`).set('Cookie', cookies)

  const deleteTask = (id: string) =>
    request(app.getHttpServer()).delete(`/tasks/${id}`).set('Cookie', cookies)

  describe('POST /tasks', () => {
    it('создаёт задачу и отдаёт 201', async () => {
      const response = await create({ title: 'Купить кофе' }).expect(201)

      expect(response.body).toMatchObject({ title: 'Купить кофе' })
      expect(response.body.id).toEqual(expect.any(String))
    })

    it('обрезает пробелы по краям title', async () => {
      const response = await create({ title: '  С пробелами  ' }).expect(201)

      expect(response.body.title).toBe('С пробелами')
    })

    it('отклоняет пустой title', () => {
      return create({ title: '' }).expect(400)
    })

    it('отклоняет title из одних пробелов — trim выполняется до проверки', () => {
      return create({ title: '     ' }).expect(400)
    })

    it('отклоняет запрос без title', () => {
      return create({}).expect(400)
    })

    it('отклоняет title длиннее 255 символов', () => {
      return create({ title: 'а'.repeat(256) }).expect(400)
    })

    it('отклоняет description длиннее 2000 символов', () => {
      return create({ title: 'Задача', description: 'д'.repeat(2001) }).expect(400)
    })

    it('отклоняет неизвестные поля — forbidNonWhitelisted', () => {
      return create({ title: 'Задача', hacked: true }).expect(400)
    })

    it('отдаёт ошибку в формате HttpExceptionFilter', async () => {
      const response = await create({ title: '' }).expect(400)

      expect(response.body).toEqual({
        statusCode: 400,
        message: expect.any(Array),
        path: '/tasks',
      })
    })
  })

  describe('GET /tasks', () => {
    it('возвращает пустой список, пока задач нет', () => {
      return getTasks().expect(200).expect([])
    })

    // Проверяем состав, а не порядок: обе задачи создаются в одну миллисекунду,
    // и сортировка по createdAt между ними неустойчива. Сам порядок «от новых
    // к старым» покрыт unit-тестом, где время подменяется фейковым таймером.
    it('возвращает созданные задачи', async () => {
      await create({ title: 'Первая' })
      await create({ title: 'Вторая' })

      const response = await getTasks().expect(200)

      expect(response.body.map((t: { title: string }) => t.title).sort()).toEqual([
        'Вторая',
        'Первая',
      ])
    })
  })

  describe('PUT /tasks/:id', () => {
    it('обновляет задачу', async () => {
      const { body: task } = await create({ title: 'Было' })

      const response = await putTask(task.id)
        .send({ title: 'Стало' })
        .expect(200)

      expect(response.body.title).toBe('Стало')
    })

    // Регрессия: ValidationPipe с transform: true отдаёт экземпляр DTO,
    // где непереданный title присутствует как undefined. Наивный спред
    // затирал им сохранённое значение — задача оставалась без title.
    it('не затирает поля, которых нет в теле запроса', async () => {
      const { body: task } = await create({ title: 'Было', description: 'Описание' })

      const response = await putTask(task.id)
        .send({ description: 'Новое описание' })
        .expect(200)

      expect(response.body).toMatchObject({ title: 'Было', description: 'Новое описание' })
    })

    it('пустое тело оставляет задачу нетронутой', async () => {
      const { body: task } = await create({ title: 'Без изменений' })

      const response = await putTask(task.id)
        .send({})
        .expect(200)

      expect(response.body.title).toBe('Без изменений')
    })

    it('обрезает пробелы по краям title', async () => {
      const { body: task } = await create({ title: 'Было' })

      const response = await putTask(task.id)
        .send({ title: '  Стало  ' })
        .expect(200)

      expect(response.body.title).toBe('Стало')
    })

    it('отдаёт 404 для несуществующей задачи', () => {
      return putTask('3f1e4c9a-0b7d-4e2f-8a11-5c6d7e8f9a0b')
        .send({ title: 'Неважно' })
        .expect(404)
    })

    it('отдаёт 400, если id не UUID — ParseUUIDPipe', () => {
      return putTask('не-uuid')
        .send({ title: 'Неважно' })
        .expect(400)
    })
  })

  describe('DELETE /tasks/:id', () => {
    it('удаляет задачу и отдаёт 204', async () => {
      const { body: task } = await create({ title: 'На удаление' })

      await deleteTask(task.id).expect(204)

      await getTasks().expect(200).expect([])
    })

    it('отдаёт 404 для несуществующей задачи', () => {
      return deleteTask('3f1e4c9a-0b7d-4e2f-8a11-5c6d7e8f9a0b')
        .expect(404)
    })

    it('отдаёт 400, если id не UUID — ParseUUIDPipe', () => {
      return deleteTask('не-uuid').expect(400)
    })
  })
})
