import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiExcludeController } from '@nestjs/swagger'
import type { DevConfigResponse, HealthResponse } from '@repo/shared'
import { AppService } from './app.service'
import { Public } from './modules/auth/decorators/public.decorator'

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  // Docker и оркестраторы проверяют этот endpoint чтобы знать что сервис готов
  @Public()
  @Get('health')
  health(): HealthResponse {
    return { status: 'ok' }
  }

  @Public()
  @Get('dev/config')
  devConfig(): DevConfigResponse {
    return {
      swagger: this.config.get<boolean>('SWAGGER_ENABLED') ?? false,
      publicUrl: this.publicUrl(),
    }
  }

  // Адрес, по которому браузер может обратиться к бэкенду напрямую.
  // В dev это собственный порт; в production бэкенд спрятан за reverse proxy
  // и своего адреса снаружи не имеет — пустая строка означает «тот же origin,
  // что и фронтенд», и ссылки в DevPanel становятся относительными.
  private publicUrl(): string {
    if (this.config.get<string>('NODE_ENV') === 'production') return ''
    return `http://localhost:${this.config.get<number>('PORT')}`
  }
}
