import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Session } from './session.entity'

@Injectable()
export class SessionsStore {
  private readonly sessions = new Map<string, Session>()

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.refreshTokenHash === refreshTokenHash) return session
    }
    return null
  }

  async findAllByUserId(userId: string): Promise<Session[]> {
    return [...this.sessions.values()].filter(session => session.userId === userId)
  }

  async create(data: {
    userId: string
    familyId: string
    refreshTokenHash: string
    expiresAt: Date
    userAgent: string | null
    ip: string | null
  }): Promise<Session> {
    const now = new Date()
    const session: Session = {
      id: randomUUID(),
      isUsed: false,
      lastUsedAt: now,
      createdAt: now,
      ...data,
    }
    this.sessions.set(session.id, session)
    return session
  }

  // Атомарный claim: единственная точка синхронизации. Конкурентных запросов
  // здесь нет благодаря однопоточности event loop — проверка условий (isUsed,
  // expiresAt) и запись состояния происходят без await между ними.
  async claim(id: string): Promise<{ count: number }> {
    const session = this.sessions.get(id)
    const now = new Date()
    if (!session || session.isUsed || session.expiresAt <= now) return { count: 0 }
    session.isUsed = true
    session.lastUsedAt = now
    return { count: 1 }
  }

  async deleteByFamilyId(familyId: string): Promise<void> {
    for (const [id, session] of this.sessions) {
      if (session.familyId === familyId) this.sessions.delete(id)
    }
  }

  async deleteByRefreshTokenHash(refreshTokenHash: string): Promise<void> {
    for (const [id, session] of this.sessions) {
      if (session.refreshTokenHash === refreshTokenHash) this.sessions.delete(id)
    }
  }

  async deleteExpired(): Promise<{ count: number }> {
    const now = new Date()
    let count = 0
    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.sessions.delete(id)
        count++
      }
    }
    return { count }
  }

  async clear(): Promise<void> {
    this.sessions.clear()
  }

  async expire(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (session) session.expiresAt = new Date(0)
  }
}
