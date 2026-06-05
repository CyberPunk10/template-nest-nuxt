import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { User } from './user.entity'

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ]

  findAll(): User[] {
    return this.users
  }

  create(dto: CreateUserDto): User {
    const user: User = { id: String(this.users.length + 1), ...dto }
    this.users.push(user)
    return user
  }

  findOne(id: string): User {
    const user = this.users.find((u) => u.id === id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  update(id: string, dto: CreateUserDto): User {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) throw new NotFoundException(`User ${id} not found`)
    this.users[index] = { ...this.users[index], ...dto }
    return this.users[index]
  }

  remove(id: string): void {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) throw new NotFoundException(`User ${id} not found`)
    this.users.splice(index, 1)
  }
}
