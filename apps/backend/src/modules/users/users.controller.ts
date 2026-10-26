import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtPayload } from '../auth/strategies/jwt.strategy'
import { Role } from '../../generated/prisma/enums'
import { UpdateUserDto } from './dto/update-user.dto'
import { SafeUser, UsersService } from './users.service'

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Получить всех пользователей (только admin)' })
  @ApiResponse({ status: 200, description: 'Список пользователей' })
  @ApiResponse({ status: 403, description: 'Требуется роль admin' })
  @Roles(Role.admin)
  @Get()
  findAll(): Promise<SafeUser[]> {
    return this.usersService.findAll()
  }

  @ApiOperation({ summary: 'Получить пользователя по ID (свой профиль или admin — любой)' })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 403, description: 'Чужой пользователь (и текущий пользователь не admin)' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SafeUser> {
    this.assertSelfOrAdmin(id, user)
    return this.usersService.findOne(id)
  }

  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь обновлён' })
  @ApiResponse({ status: 403, description: 'Чужой пользователь' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SafeUser> {
    this.assertSelf(id, user)
    return this.usersService.update(id, dto)
  }

  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ status: 204, description: 'Пользователь удалён' })
  @ApiResponse({ status: 403, description: 'Чужой пользователь' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    this.assertSelf(id, user)
    return this.usersService.remove(id)
  }

  private assertSelf(id: string, user: JwtPayload): void {
    if (user.sub !== id) throw new ForbiddenException()
  }

  // Admin может просматривать чужие профили (поддержка/модерация), но не менять
  // и не удалять их через self-service роуты — только владелец управляет своими данными.
  private assertSelfOrAdmin(id: string, user: JwtPayload): void {
    if (user.role === Role.admin) return
    this.assertSelf(id, user)
  }
}
