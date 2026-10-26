import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { createHmac, randomUUID } from 'crypto'
import { Response, Request } from 'express'
import { Prisma } from '../../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { JwtPayload } from './strategies/jwt.strategy'
import { SafeUser, safeUserSelect } from '../users/users.service'

@Injectable()
export class AuthService implements OnModuleInit {
  // Генерируется при старте с текущим BCRYPT_ROUNDS, чтобы время сравнения совпадало с реальными хешами.
  // Защита от email enumeration: bcrypt.compare выполняется даже если email не найден.
  private dummyHash!: string

  private readonly bcryptRounds: number

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.bcryptRounds = this.config.get<number>('BCRYPT_ROUNDS', 12)
  }

  async onModuleInit(): Promise<void> {
    this.dummyHash = await bcrypt.hash(randomUUID(), this.bcryptRounds)
  }

  // path: '/' — cookie видна всем роутам. Без этого clearCookie() не удалит её,
  // т.к. Express требует совпадения path при установке и удалении.
  private get cookieOptions() {
    const isProd = this.config.get('NODE_ENV') === 'production'
    return {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: isProd,
      path: '/',
    }
  }

  private get refreshExpiresInDays(): number {
    return this.config.get<number>('REFRESH_TOKEN_EXPIRES_DAYS', 7)
  }

  private get accessExpiresInMs(): number {
    const raw = this.config.get<string>('JWT_EXPIRES_IN', '15m')
    const match = raw.match(/^(\d+)(s|m|h|d)$/)
    if (!match) return 15 * 60 * 1000
    const n = parseInt(match[1], 10)
    const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
    return n * units[match[2]]
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    expiresInDays: number,
  ): void {
    res.cookie('access_token', accessToken, {
      ...this.cookieOptions,
      maxAge: this.accessExpiresInMs,
    })
    res.cookie('refresh_token', refreshToken, {
      ...this.cookieOptions,
      maxAge: expiresInDays * 24 * 60 * 60 * 1000,
    })
  }

  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { ...safeUserSelect, passwordHash: true },
    })
    const hash = user?.passwordHash ?? this.dummyHash
    const valid = await bcrypt.compare(password, hash)
    if (!user || !valid) return null
    const { passwordHash: _, ...safeUser } = user
    return safeUser
  }

  async register(dto: RegisterDto, req: Request, res: Response): Promise<SafeUser> {
    const email = dto.email.toLowerCase()
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds)

    let safeUser: SafeUser
    try {
      safeUser = await this.prisma.user.create({
        data: { name: dto.name, email, passwordHash },
        select: safeUserSelect,
      })
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Email already in use')
      }
      throw e
    }

    await this.issueTokens(safeUser, req, res)
    return safeUser
  }

  async login(safeUser: SafeUser, req: Request, res: Response): Promise<SafeUser> {
    await this.issueTokens(safeUser, req, res)
    return safeUser
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const token: string | undefined = req.cookies?.['refresh_token']
    if (!token) throw new UnauthorizedException()

    const tokenHash = this.hmac(token)

    // Load session to get familyId; don't trust isUsed/expiresAt until inside tx
    const sess = await this.prisma.session.findUnique({ where: { refreshTokenHash: tokenHash } })
    if (!sess) throw new UnauthorizedException()

    // Generate new token BEFORE transaction — UUID generation doesn't create a race;
    // the race was in the CHECK, not the generation.
    const newRefreshToken = randomUUID()
    const newRefreshTokenHash = this.hmac(newRefreshToken)
    const expiresInDays = this.refreshExpiresInDays
    const expiresAt = this.getRefreshExpiresAt()

    // Atomic claim + replacement: updateMany is the single gate — only one concurrent
    // request wins — and the replacement session is created in the SAME transaction,
    // so a crash between claim and create can no longer strand the family with no
    // usable token on either side.
    // deleteMany (family wipe on reuse) runs OUTSIDE the transaction so it is not rolled back.
    const now = new Date()
    let user: SafeUser | null
    try {
      user = await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.session.updateMany({
          where: { id: sess.id, isUsed: false, expiresAt: { gt: now } },
          data: { isUsed: true, lastUsedAt: now },
        })

        if (count === 0) return null

        const user = await tx.user.findUniqueOrThrow({
          where: { id: sess.userId },
          select: safeUserSelect,
        })

        await tx.session.create({
          data: {
            userId: user.id,
            familyId: sess.familyId,
            refreshTokenHash: newRefreshTokenHash,
            expiresAt,
            ...this.getSessionMeta(req),
          },
        })

        return user
      })
    } catch (e: unknown) {
      // Session outlived its user (e.g. deleted mid-refresh) — treat like any other invalid session.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        this.clearCookies(res)
        throw new UnauthorizedException()
      }
      throw e
    }

    if (!user) {
      // Either already used (reuse attack) or expired — wipe the entire family
      // to invalidate all tokens in the chain, then deny.
      await this.prisma.session.deleteMany({ where: { familyId: sess.familyId } })
      this.clearCookies(res)
      throw new UnauthorizedException()
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }
    const accessToken = this.jwtService.sign(payload)

    this.setTokenCookies(res, accessToken, newRefreshToken, expiresInDays)
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token: string | undefined = req.cookies?.['refresh_token']
    if (token) {
      const tokenHash = this.hmac(token)
      // deleteMany вместо delete — не бросает ошибку если сессия уже удалена
      // (истекла, reuse detection, параллельный logout)
      await this.prisma.session.deleteMany({ where: { refreshTokenHash: tokenHash } })
    }
    this.clearCookies(res)
  }

  private async issueTokens(user: SafeUser, req: Request, res: Response): Promise<void> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }
    const accessToken = this.jwtService.sign(payload)

    const refreshToken = randomUUID()
    const refreshTokenHash = this.hmac(refreshToken)
    const expiresInDays = this.refreshExpiresInDays
    const expiresAt = this.getRefreshExpiresAt()

    await this.prisma.session.create({
      data: {
        userId: user.id,
        familyId: randomUUID(),
        refreshTokenHash,
        expiresAt,
        ...this.getSessionMeta(req),
      },
    })

    this.setTokenCookies(res, accessToken, refreshToken, expiresInDays)
  }

  private clearCookies(res: Response): void {
    res.clearCookie('access_token', this.cookieOptions)
    res.clearCookie('refresh_token', this.cookieOptions)
  }

  private getRefreshExpiresAt(): Date {
    return new Date(Date.now() + this.refreshExpiresInDays * 24 * 60 * 60 * 1000)
  }

  private getSessionMeta(req: Request) {
    return {
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    }
  }

  private hmac(token: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('REFRESH_TOKEN_SECRET'))
      .update(token)
      .digest('hex')
  }
}
