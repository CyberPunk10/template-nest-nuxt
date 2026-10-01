import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { setupApp } from './setup-app'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  // Запрос приходит не от клиента, а от прокси внутри сети Docker:
  // браузер → nginx → Nuxt → backend. Реальный адрес клиента nginx пишет в
  // X-Forwarded-For. Доверяем этому заголовку только от адресов внутренних
  // сетей — тогда req.ip — это клиент (по нему считает лимиты throttler), а
  // подделать его снаружи нельзя: nginx дописывает настоящий адрес в конец.
  app.set('trust proxy', 'loopback, linklocal, uniquelocal')
  const config = app.get(ConfigService)
  setupApp(app)
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN') })

  if (config.get<boolean>('SWAGGER_ENABLED')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('template-nest-nuxt API').setVersion('1.0').build(),
    )
    SwaggerModule.setup('api/docs', app, document)
  }

  await app.listen(config.get<number>('PORT', 3100))
}
void bootstrap()
