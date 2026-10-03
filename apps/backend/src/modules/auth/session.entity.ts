export interface Session {
  id: string
  userId: string
  familyId: string
  refreshTokenHash: string
  isUsed: boolean
  userAgent: string | null
  ip: string | null
  lastUsedAt: Date
  expiresAt: Date
  createdAt: Date
}
