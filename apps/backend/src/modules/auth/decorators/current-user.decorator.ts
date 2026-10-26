import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import { JwtPayload } from '../strategies/jwt.strategy'

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): JwtPayload => {
  const request = ctx.switchToHttp().getRequest<Request>()
  return request.user as JwtPayload
})
