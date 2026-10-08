import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { Task } from './task.entity'
import { UsersService } from '../users/users.service'

@Injectable()
export class TasksService {
  private readonly tasks: Task[] = []

  constructor(private readonly usersService: UsersService) {}

  async findAll(userId: string): Promise<Task[]> {
    return this.tasks
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findAllGlobal(): Promise<(Task & { user: { name: string } })[]> {
    const users = await this.usersService.findAll()
    const nameById = new Map(users.map(u => [u.id, u.name]))
    return this.tasks
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(task => ({ ...task, user: { name: nameById.get(task.userId) ?? '' } }))
  }

  findOne(id: string, userId: string): Task {
    const task = this.tasks.find(t => t.id === id)
    if (!task) throw new NotFoundException(`Task ${id} not found`)
    if (task.userId !== userId) throw new ForbiddenException()
    return task
  }

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    const now = new Date()
    const task: Task = {
      id: randomUUID(),
      title: dto.title,
      description: dto.description ?? null,
      userId,
      createdAt: now,
      updatedAt: now,
    }
    this.tasks.push(task)
    return task
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = this.findOne(id, userId)
    // ValidationPipe с transform: true отдаёт экземпляр DTO, где непереданные
    // необязательные поля присутствуют как undefined. Спред такого объекта
    // затёр бы ими существующие значения, поэтому отбираем только заданные.
    const changes = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined))
    Object.assign(task, changes, { updatedAt: new Date() })
    return task
  }

  async remove(id: string, userId: string): Promise<void> {
    this.findOne(id, userId)
    const index = this.tasks.findIndex(t => t.id === id)
    this.tasks.splice(index, 1)
  }
}
