import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { SafeUser } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { Public } from './decorators/public.decorator'
import { JwtPayload } from './strategies/jwt.strategy'
import { UsersService } from '../users/users.service'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Регистрация' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Email уже занят' })
  register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, req, res)
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  @ApiBody({ type: LoginDto })
  login(
    @Body() _dto: LoginDto,
    @Req() req: Request & { user: SafeUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(req.user, req, res)
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res)
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Выход' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res)
  }

  @Get('me')
  @ApiOperation({ summary: 'Текущий пользователь' })
  async me(@Req() req: Request & { user: JwtPayload }): Promise<SafeUser> {
    try {
      return await this.usersService.findOne(req.user.sub)
    } catch (e: unknown) {
      if (e instanceof NotFoundException) throw new UnauthorizedException()
      throw e
    }
  }
}
