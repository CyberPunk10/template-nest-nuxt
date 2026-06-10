import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { Public } from './decorators/public.decorator'
import { JwtPayload } from './strategies/jwt.strategy'
import { User } from '../../generated/prisma/client'
import { UsersService } from '../users/users.service'

type SafeUser = Omit<User, 'passwordHash'>

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Регистрация' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Email уже занят' })
  register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(dto, res)
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  login(
    @Req() req: Request & { user: Omit<User, 'passwordHash'> },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(req.user, res)
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res)
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Выход' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res)
  }

  @Get('me')
  @ApiOperation({ summary: 'Текущий пользователь' })
  async me(@Req() req: Request & { user: JwtPayload }): Promise<SafeUser> {
    const { passwordHash: _, ...safe } = await this.usersService.findOne(req.user.sub)
    return safe
  }
}
