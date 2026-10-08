import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { TasksService } from './tasks.service'

const mockTask = {
  id: 'task-1',
  title: 'Task 1',
  description: null,
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const prismaMock = {
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

describe('TasksService', () => {
  let service: TasksService

  // Сервис — тонкая обёртка над Prisma, поэтому в тестах подменяем PrismaService
  // моком: проверяем, какой запрос сервис строит и как обрабатывает ответ.
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prismaMock }],
    }).compile()

    service = module.get<TasksService>(TasksService)
    jest.clearAllMocks()
  })

  it('findAll — возвращает задачи указанного пользователя', async () => {
    prismaMock.task.findMany.mockResolvedValue([mockTask])
    const result = await service.findAll('user-1')
    expect(result).toEqual([mockTask])
    expect(prismaMock.task.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('findAllGlobal — возвращает задачи всех пользователей с именем владельца', async () => {
    const withUser = { ...mockTask, user: { name: 'Alice' } }
    prismaMock.task.findMany.mockResolvedValue([withUser])
    const result = await service.findAllGlobal()
    expect(result).toEqual([withUser])
    expect(prismaMock.task.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    })
  })

  it('findOne — возвращает задачу владельцу', async () => {
    prismaMock.task.findUnique.mockResolvedValue(mockTask)
    const result = await service.findOne('task-1', 'user-1')
    expect(result).toEqual(mockTask)
  })

  it('findOne — выбрасывает NotFoundException если задача не найдена', async () => {
    prismaMock.task.findUnique.mockResolvedValue(null)
    await expect(service.findOne('nonexistent-id', 'user-1')).rejects.toThrow(NotFoundException)
  })

  it('findOne — выбрасывает ForbiddenException при обращении к чужой задаче', async () => {
    prismaMock.task.findUnique.mockResolvedValue(mockTask)
    await expect(service.findOne('task-1', 'user-2')).rejects.toThrow(ForbiddenException)
  })

  it('create — создаёт задачу для указанного пользователя', async () => {
    prismaMock.task.create.mockResolvedValue(mockTask)
    const result = await service.create({ title: 'Task 1' }, 'user-1')
    expect(result).toEqual(mockTask)
    expect(prismaMock.task.create).toHaveBeenCalledWith({
      data: { title: 'Task 1', userId: 'user-1' },
    })
  })

  it('create — передаёт description, когда он задан', async () => {
    const withDescription = { ...mockTask, description: 'Описание' }
    prismaMock.task.create.mockResolvedValue(withDescription)

    await service.create({ title: 'Task 1', description: 'Описание' }, 'user-1')

    expect(prismaMock.task.create).toHaveBeenCalledWith({
      data: { title: 'Task 1', description: 'Описание', userId: 'user-1' },
    })
  })

  it('update — обновляет задачу владельца', async () => {
    const updated = { ...mockTask, title: 'New title' }
    prismaMock.task.findUnique.mockResolvedValue(mockTask)
    prismaMock.task.update.mockResolvedValue(updated)
    const result = await service.update('task-1', { title: 'New title' }, 'user-1')
    expect(result.title).toBe('New title')
    expect(prismaMock.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { title: 'New title' },
    })
  })

  // Prisma трактует undefined как «поле не передано» и не включает его в SET,
  // поэтому dto от ValidationPipe (где непереданные поля присутствуют как
  // undefined) можно отдавать в data напрямую — существующие значения целы.
  it('update — не затирает поля, которых нет в DTO', async () => {
    prismaMock.task.findUnique.mockResolvedValue(mockTask)
    prismaMock.task.update.mockResolvedValue(mockTask)

    await service.update('task-1', { title: undefined, description: 'Новое' }, 'user-1')

    expect(prismaMock.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { title: undefined, description: 'Новое' },
    })
  })

  it('update — выбрасывает NotFoundException для неизвестного id', async () => {
    prismaMock.task.findUnique.mockResolvedValue(null)

    await expect(service.update('nonexistent-id', { title: 'x' }, 'user-1')).rejects.toThrow(
      NotFoundException,
    )
    expect(prismaMock.task.update).not.toHaveBeenCalled()
  })

  it('update — выбрасывает ForbiddenException при попытке изменить чужую задачу', async () => {
    prismaMock.task.findUnique.mockResolvedValue(mockTask)
    await expect(service.update('task-1', { title: 'Hacked' }, 'user-2')).rejects.toThrow(
      ForbiddenException,
    )
    expect(prismaMock.task.update).not.toHaveBeenCalled()
  })

  it('remove — удаляет задачу владельца', async () => {
    prismaMock.task.findUnique.mockResolvedValue(mockTask)
    prismaMock.task.delete.mockResolvedValue(mockTask)
    await expect(service.remove('task-1', 'user-1')).resolves.toBeUndefined()
    expect(prismaMock.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } })
  })

  it('remove — выбрасывает NotFoundException для неизвестного id', async () => {
    prismaMock.task.findUnique.mockResolvedValue(null)

    await expect(service.remove('nonexistent-id', 'user-1')).rejects.toThrow(NotFoundException)
    expect(prismaMock.task.delete).not.toHaveBeenCalled()
  })

  it('remove — выбрасывает ForbiddenException при попытке удалить чужую задачу', async () => {
    prismaMock.task.findUnique.mockResolvedValue(mockTask)
    await expect(service.remove('task-1', 'user-2')).rejects.toThrow(ForbiddenException)
    expect(prismaMock.task.delete).not.toHaveBeenCalled()
  })
})
