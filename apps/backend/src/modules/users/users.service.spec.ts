import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Prisma } from '../../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from './users.service'

const mockUser = {
  id: 'uuid-1',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const prismaMock = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock', {
    code,
    clientVersion: '0.0.0',
  })
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile()

    service = module.get<UsersService>(UsersService)
    jest.clearAllMocks()
  })

  it('findAll — возвращает список пользователей', async () => {
    prismaMock.user.findMany.mockResolvedValue([mockUser])
    const result = await service.findAll()
    expect(result).toEqual([mockUser])
    expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1)
  })

  it('findOne — возвращает пользователя по id', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser)
    const result = await service.findOne('uuid-1')
    expect(result).toEqual(mockUser)
  })

  it('findOne — выбрасывает NotFoundException если не найден', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    await expect(service.findOne('uuid-999')).rejects.toThrow(NotFoundException)
  })

  it('update — обновляет пользователя', async () => {
    const updated = { ...mockUser, name: 'Bob' }
    prismaMock.user.update.mockResolvedValue(updated)
    const result = await service.update('uuid-1', { name: 'Bob' })
    expect(result.name).toBe('Bob')
  })

  it('update — выбрасывает NotFoundException если не найден (P2025)', async () => {
    prismaMock.user.update.mockRejectedValue(makePrismaError('P2025'))
    await expect(service.update('uuid-999', { name: 'Bob' })).rejects.toThrow(NotFoundException)
  })

  it('update — выбрасывает ConflictException при дублирующемся email (P2002)', async () => {
    prismaMock.user.update.mockRejectedValue(makePrismaError('P2002'))
    await expect(service.update('uuid-1', { email: 'taken@example.com' }))
      .rejects.toThrow(ConflictException)
  })

  it('remove — удаляет пользователя', async () => {
    prismaMock.user.delete.mockResolvedValue(mockUser)
    await expect(service.remove('uuid-1')).resolves.toBeUndefined()
  })

  it('remove — выбрасывает NotFoundException если не найден (P2025)', async () => {
    prismaMock.user.delete.mockRejectedValue(makePrismaError('P2025'))
    await expect(service.remove('uuid-999')).rejects.toThrow(NotFoundException)
  })
})
