import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name)

  constructor(private readonly prisma: PrismaService) {}

  // Каждую ночь в 03:00 удаляем все истёкшие сессии —
  // как активные (пользователь не заходил), так и isUsed: true (отработавшие ловушки).
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredSessions(): Promise<void> {
    const { count } = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    if (count > 0) {
      this.logger.log(`Deleted ${count} expired sessions`)
    }
  }
}
