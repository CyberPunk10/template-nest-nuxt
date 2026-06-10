import { Controller, Get } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { AppService } from './app.service'
import { Public } from './modules/auth/decorators/public.decorator'

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  // Docker и оркестраторы проверяют этот endpoint чтобы знать что сервис готов
  @Public()
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' }
  }
}
