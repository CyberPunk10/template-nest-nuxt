import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SessionsStore } from './sessions.store'

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name)

  constructor(private readonly sessions: SessionsStore) {}

  // Каждую ночь в 03:00 удаляем все сессии с истёкшим expiresAt —
  // как активные (пользователь не заходил), так и isUsed: true (отработавшие ловушки).
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const { count } = await this.sessions.deleteExpired()
      if (count > 0) {
        this.logger.log(`Deleted ${count} expired sessions`)
      }
    } catch (err) {
      this.logger.error('Failed to cleanup expired sessions', err)
    }
  }
}
