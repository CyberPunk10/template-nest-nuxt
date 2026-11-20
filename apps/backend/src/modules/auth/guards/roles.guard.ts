import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { Role } from '../../../generated/prisma/enums'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { JwtPayload } from '../strategies/jwt.strategy'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles?.length) return true

    const { user } = context.switchToHttp().getRequest<Request & { user: JwtPayload }>()
    if (!requiredRoles.includes(user.role)) throw new ForbiddenException()
    return true
  }
}
