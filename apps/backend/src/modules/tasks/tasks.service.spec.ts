import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { plainToInstance } from 'class-transformer'
import { UsersService } from '../users/users.service'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TasksService } from './tasks.service'

describe('TasksService', () => {
  let service: TasksService
  let users: UsersService

  // Хранилище in-memory живёт в самом сервисе, поэтому для каждого теста
  // нужен свежий экземпляр — иначе задачи протекают между тестами.
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, UsersService],
    }).compile()

    service = module.get<TasksService>(TasksService)
    users = module.get<UsersService>(UsersService)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('create — создаёт задачу для указанного пользователя', async () => {
    const task = await service.create({ title: 'Task 1' }, 'user-1')
    expect(task.title).toBe('Task 1')
    expect(task.userId).toBe('user-1')
  })

  it('create — заполняет id и временные метки', async () => {
    const task = await service.create({ title: 'Купить кофе' }, 'user-1')

    expect(task.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(task.createdAt).toBeInstanceOf(Date)
    expect(task.updatedAt).toEqual(task.createdAt)
  })

  it('create — выдаёт разные id разным задачам', async () => {
    const first = await service.create({ title: 'Первая' }, 'user-1')
    const second = await service.create({ title: 'Вторая' }, 'user-1')

    expect(first.id).not.toBe(second.id)
  })

  it('findAll — возвращает пустой список, пока задач нет', async () => {
    expect(await service.findAll('user-1')).toEqual([])
  })

  it('findAll — возвращает только задачи текущего пользователя', async () => {
    await service.create({ title: 'Alice task' }, 'user-1')
    await service.create({ title: 'Bob task' }, 'user-2')

    const aliceTasks = await service.findAll('user-1')
    expect(aliceTasks).toHaveLength(1)
    expect(aliceTasks[0].title).toBe('Alice task')
  })

  it('findAll — возвращает задачи от новых к старым', async () => {
    // Метки ставятся через new Date() — без подмены времени обе задачи
    // попадут в одну миллисекунду, и порядок сортировки будет неопределённым.
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'))
    await service.create({ title: 'Первая' }, 'user-1')
    jest.setSystemTime(new Date('2026-01-01T00:00:01Z'))
    await service.create({ title: 'Вторая' }, 'user-1')

    const titles = (await service.findAll('user-1')).map(t => t.title)
    expect(titles).toEqual(['Вторая', 'Первая'])
  })

  it('findOne — возвращает задачу владельцу', async () => {
    const task = await service.create({ title: 'Task 1' }, 'user-1')
    const found = service.findOne(task.id, 'user-1')
    expect(found.id).toBe(task.id)
  })

  it('findOne — выбрасывает NotFoundException если задача не найдена', () => {
    expect(() => service.findOne('nonexistent-id', 'user-1')).toThrow(NotFoundException)
  })

  it('findOne — выбрасывает ForbiddenException при обращении к чужой задаче', async () => {
    const task = await service.create({ title: 'Alice task' }, 'user-1')
    expect(() => service.findOne(task.id, 'user-2')).toThrow(ForbiddenException)
  })

  it('update — обновляет задачу владельца', async () => {
    const task = await service.create({ title: 'Old title' }, 'user-1')
    const updated = await service.update(task.id, { title: 'New title' }, 'user-1')
    expect(updated.title).toBe('New title')
  })

  it('update — меняет только переданные поля', async () => {
    const task = await service.create({ title: 'Было', description: 'Описание' }, 'user-1')

    const updated = await service.update(task.id, { title: 'Стало' }, 'user-1')

    expect(updated.title).toBe('Стало')
    expect(updated.description).toBe('Описание')
  })

  // В бою сервис получает не литерал, а экземпляр DTO от ValidationPipe
  // с transform: true. У такого объекта непереданные необязательные поля
  // присутствуют как undefined — на литерале (тест выше) эта разница
  // не видна, поэтому DTO строим ровно так же, как это делает пайп.
  it('update — не затирает поля, отсутствующие в DTO от ValidationPipe', async () => {
    const task = await service.create({ title: 'Было', description: 'Описание' }, 'user-1')
    const dto = plainToInstance(UpdateTaskDto, { description: 'Новое описание' })

    const updated = await service.update(task.id, dto, 'user-1')

    expect(updated.title).toBe('Было')
    expect(updated.description).toBe('Новое описание')
  })

  it('update — пустой DTO оставляет поля нетронутыми', async () => {
    const task = await service.create({ title: 'Было', description: 'Описание' }, 'user-1')

    const updated = await service.update(task.id, plainToInstance(UpdateTaskDto, {}), 'user-1')

    expect(updated).toMatchObject({ title: 'Было', description: 'Описание' })
  })

  it('update — сдвигает updatedAt, не трогая createdAt', async () => {
    const task = await service.create({ title: 'Задача' }, 'user-1')
    // Метки ставятся через new Date() — без подмены времени два вызова
    // подряд попадут в одну миллисекунду, и сдвиг будет незаметен.
    jest.useFakeTimers().setSystemTime(task.createdAt.getTime() + 1000)

    const updated = await service.update(task.id, { title: 'Изменено' }, 'user-1')

    expect(updated.createdAt).toEqual(task.createdAt)
    expect(updated.updatedAt.getTime()).toBeGreaterThan(task.createdAt.getTime())
  })

  it('update — выбрасывает NotFoundException для неизвестного id', async () => {
    await expect(service.update('нет-такой', { title: 'x' }, 'user-1')).rejects.toThrow(
      NotFoundException,
    )
  })

  it('update — выбрасывает ForbiddenException при попытке изменить чужую задачу', async () => {
    const task = await service.create({ title: 'Alice task' }, 'user-1')
    await expect(service.update(task.id, { title: 'Hacked' }, 'user-2')).rejects.toThrow(
      ForbiddenException,
    )
  })

  it('remove — удаляет задачу владельца', async () => {
    const task = await service.create({ title: 'Task 1' }, 'user-1')
    await service.remove(task.id, 'user-1')
    expect(() => service.findOne(task.id, 'user-1')).toThrow(NotFoundException)
  })

  it('remove — не задевает соседние задачи', async () => {
    const first = await service.create({ title: 'Остаётся' }, 'user-1')
    const second = await service.create({ title: 'Удаляется' }, 'user-1')

    await service.remove(second.id, 'user-1')

    expect(await service.findAll('user-1')).toEqual([first])
  })

  it('remove — выбрасывает NotFoundException для неизвестного id', async () => {
    await expect(service.remove('нет-такой', 'user-1')).rejects.toThrow(NotFoundException)
  })

  it('remove — выбрасывает ForbiddenException при попытке удалить чужую задачу', async () => {
    const task = await service.create({ title: 'Alice task' }, 'user-1')
    await expect(service.remove(task.id, 'user-2')).rejects.toThrow(ForbiddenException)
  })

  it('findAllGlobal — возвращает задачи всех пользователей с именем владельца', async () => {
    const alice = await users.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'supersecret',
    })
    await service.create({ title: 'Alice task' }, alice.id)

    const result = await service.findAllGlobal()
    expect(result).toHaveLength(1)
    expect(result[0].user.name).toBe('Alice')
  })
})
