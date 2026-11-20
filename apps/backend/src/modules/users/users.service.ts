import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { User } from './user.entity'
import { Role } from './role.enum'
import { UpdateUserDto } from './dto/update-user.dto'
import { CreateUserDto } from './dto/create-user.dto'

export type SafeUser = Omit<User, 'passwordHash'>

function toSafeUser({ passwordHash: _passwordHash, ...safeUser }: User): SafeUser {
  return safeUser
}

@Injectable()
export class UsersService {
  private readonly users: User[] = []

  async findAll(): Promise<SafeUser[]> {
    return this.users.map(toSafeUser)
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    return this.createWithRole(dto, Role.User)
  }

  async createWithRole(dto: CreateUserDto, role: Role): Promise<SafeUser> {
    if (this.users.some(u => u.email === dto.email)) {
      throw new ConflictException('Email already in use')
    }
    const now = new Date()
    const user: User = {
      id: randomUUID(),
      name: dto.name,
      email: dto.email,
      passwordHash: dto.password,
      role,
      createdAt: now,
      updatedAt: now,
    }
    this.users.push(user)
    return toSafeUser(user)
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = this.users.find(u => u.id === id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return toSafeUser(user)
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const user = this.users.find(u => u.id === id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    if (dto.email && this.users.some(u => u.id !== id && u.email === dto.email)) {
      throw new ConflictException('Email already in use')
    }
    Object.assign(user, dto, { updatedAt: new Date() })
    return toSafeUser(user)
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) ?? null
  }

  async remove(id: string): Promise<void> {
    const index = this.users.findIndex(u => u.id === id)
    if (index === -1) throw new NotFoundException(`User ${id} not found`)
    this.users.splice(index, 1)
  }

  async removeByEmails(emails: string[]): Promise<void> {
    for (const email of emails) {
      const index = this.users.findIndex(u => u.email === email)
      if (index !== -1) this.users.splice(index, 1)
    }
  }
}
