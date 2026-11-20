import { INestApplication, ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

// Глобальные пайпы и фильтры приложения — единственное место, где они
// перечислены. main.ts и e2e-тесты вызывают эту функцию, поэтому тесты
// проверяют ровно то приложение, которое поднимается в production:
// продублированный список рано или поздно разъезжается, и тогда e2e
// проходят на конфигурации, которой в бою нет.
export function setupApp(app: INestApplication): INestApplication {
  // Без cookie-parser req.cookies пуст, и JwtStrategy не найдёт access_token.
  app.use(cookieParser())
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удалять поля, которых нет в DTO
      forbidNonWhitelisted: true, // 400 вместо тихого удаления лишних полей
      transform: true, // приводить типы (string → number, plain → class)
    }),
  )

  return app
}
