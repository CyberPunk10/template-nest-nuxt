import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtPayload } from '../auth/strategies/jwt.strategy'
import { Role } from '../../generated/prisma/enums'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { Task } from '../../generated/prisma/client'
import { TasksService } from './tasks.service'

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Получить все задачи всех пользователей (только admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Требуется роль admin' })
  @Roles(Role.admin)
  @Get('all')
  findAllGlobal() {
    return this.tasksService.findAllGlobal()
  }

  @ApiOperation({ summary: 'Получить задачи текущего пользователя' })
  @ApiResponse({ status: 200 })
  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<Task[]> {
    return this.tasksService.findAll(user.sub)
  }

  @ApiOperation({ summary: 'Создать задачу' })
  @ApiResponse({ status: 201 })
  @Post()
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Task> {
    return this.tasksService.create(dto, user.sub)
  }

  @ApiOperation({ summary: 'Обновить задачу' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Чужая задача' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Task> {
    return this.tasksService.update(id, dto, user.sub)
  }

  @ApiOperation({ summary: 'Удалить задачу' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403, description: 'Чужая задача' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.tasksService.remove(id, user.sub)
  }
}
