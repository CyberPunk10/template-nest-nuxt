import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, User } from '../../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateUserDto } from './dto/update-user.dto'

export type SafeUser = Omit<User, 'passwordHash'>

export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<SafeUser[]> {
    return this.prisma.user.findMany({ select: safeUserSelect })
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: safeUserSelect })
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    try {
      return await this.prisma.user.update({ where: { id }, data: dto, select: safeUserSelect })
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // Коды ошибок Prisma: https://www.prisma.io/docs/orm/reference/error-reference
        if (e.code === 'P2025') throw new NotFoundException(`User ${id} not found`)
        if (e.code === 'P2002') throw new ConflictException('Email already in use')
      }
      throw e
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } })
    } catch (e: unknown) {
      // Коды ошибок Prisma: https://www.prisma.io/docs/orm/reference/error-reference
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`User ${id} not found`)
      }
      throw e
    }
  }
}
