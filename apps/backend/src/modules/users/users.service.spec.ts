import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('findAll — возвращает список пользователей', async () => {
    await service.create({ name: 'Alice', email: 'alice@example.com', password: 'supersecret' })
    const result = await service.findAll()
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('alice@example.com')
  })

  it('create — создаёт пользователя', async () => {
    const result = await service.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'supersecret',
    })
    expect(result.name).toBe('Alice')
    expect(result.email).toBe('alice@example.com')
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('create — выбрасывает ConflictException при дублирующемся email', async () => {
    await service.create({ name: 'Alice', email: 'taken@example.com', password: 'supersecret' })
    await expect(
      service.create({ name: 'Bob', email: 'taken@example.com', password: 'supersecret' }),
    ).rejects.toThrow(ConflictException)
  })

  it('findOne — возвращает пользователя по id', async () => {
    const created = await service.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'supersecret',
    })
    const result = await service.findOne(created.id)
    expect(result).toEqual(created)
  })

  it('findOne — выбрасывает NotFoundException если не найден', async () => {
    await expect(service.findOne('uuid-999')).rejects.toThrow(NotFoundException)
  })

  it('update — обновляет пользователя', async () => {
    const created = await service.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'supersecret',
    })
    const result = await service.update(created.id, { name: 'Bob' })
    expect(result.name).toBe('Bob')
  })

  it('update — выбрасывает NotFoundException если не найден', async () => {
    await expect(service.update('uuid-999', { name: 'Bob' })).rejects.toThrow(NotFoundException)
  })

  it('update — выбрасывает ConflictException при дублирующемся email', async () => {
    await service.create({ name: 'Alice', email: 'alice@example.com', password: 'supersecret' })
    const bob = await service.create({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'supersecret',
    })
    await expect(service.update(bob.id, { email: 'alice@example.com' })).rejects.toThrow(
      ConflictException,
    )
  })

  it('remove — удаляет пользователя', async () => {
    const created = await service.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'supersecret',
    })
    await expect(service.remove(created.id)).resolves.toBeUndefined()
    await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
  })

  it('remove — выбрасывает NotFoundException если не найден', async () => {
    await expect(service.remove('uuid-999')).rejects.toThrow(NotFoundException)
  })
})
