import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { Task } from '../../generated/prisma/client'

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  findAllGlobal(): Promise<(Task & { user: { name: string } })[]> {
    return this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    })
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } })
    if (!task) throw new NotFoundException(`Task ${id} not found`)
    if (task.userId !== userId) throw new ForbiddenException()
    return task
  }

  create(dto: CreateTaskDto, userId: string): Promise<Task> {
    return this.prisma.task.create({ data: { ...dto, userId } })
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    await this.findOne(id, userId)
    return this.prisma.task.update({ where: { id }, data: dto })
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId)
    await this.prisma.task.delete({ where: { id } })
  }
}
