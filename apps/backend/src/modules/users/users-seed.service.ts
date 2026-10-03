import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { Role } from './role.enum'
import { UsersService } from './users.service'

// Стартер без БД/сидов: аналог `prisma db seed` для in-memory-хранилища.
// Создаёт admin-аккаунт из ADMIN_EMAIL/ADMIN_PASSWORD один раз при старте приложения.
@Injectable()
export class UsersSeedService implements OnModuleInit {
  private readonly logger = new Logger(UsersSeedService.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL')
    const password = this.config.get<string>('ADMIN_PASSWORD')
    if (!email || !password) return

    const normalizedEmail = email.toLowerCase()
    if (await this.usersService.findByEmail(normalizedEmail)) return

    const bcryptRounds = this.config.get<number>('BCRYPT_ROUNDS', 12)
    const passwordHash = await bcrypt.hash(password, bcryptRounds)
    await this.usersService.createWithRole(
      { name: 'Admin', email: normalizedEmail, password: passwordHash },
      Role.Admin,
    )
    this.logger.log(`Admin account seeded: ${normalizedEmail}`)
  }
}
