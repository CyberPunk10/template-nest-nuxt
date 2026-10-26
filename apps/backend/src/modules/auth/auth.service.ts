import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { createHmac, randomUUID } from 'crypto'
import { Response, Request } from 'express'
import { SessionsStore } from './sessions.store'
import { RegisterDto } from './dto/register.dto'
import { JwtPayload } from './strategies/jwt.strategy'
import { SafeUser, UsersService } from '../users/users.service'

@Injectable()
export class AuthService implements OnModuleInit {
  // Генерируется при старте с текущим BCRYPT_ROUNDS, чтобы время сравнения совпадало с реальными хешами.
  // Защита от email enumeration: bcrypt.compare выполняется даже если email не найден.
  private dummyHash!: string

  private readonly bcryptRounds: number

  constructor(
    private readonly usersService: UsersService,
    private readonly sessions: SessionsStore,
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
    const user = await this.usersService.findByEmail(email.toLowerCase())
    const hash = user?.passwordHash ?? this.dummyHash
    const valid = await bcrypt.compare(password, hash)
    if (!user || !valid) return null
    const { passwordHash: _, ...safeUser } = user
    return safeUser
  }

  async register(dto: RegisterDto, req: Request, res: Response): Promise<SafeUser> {
    const email = dto.email.toLowerCase()
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds)

    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('Email already in use')
    }
    const safeUser = await this.usersService.create({ name: dto.name, email, password: passwordHash })

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

    // Load session to get familyId; don't trust isUsed/expiresAt until inside claim()
    const sess = await this.sessions.findByRefreshTokenHash(tokenHash)
    if (!sess) throw new UnauthorizedException()

    // Generate new token BEFORE the claim — UUID generation doesn't create a race;
    // the race was in the CHECK, not the generation.
    const newRefreshToken = randomUUID()
    const newRefreshTokenHash = this.hmac(newRefreshToken)
    const expiresInDays = this.refreshExpiresInDays
    const expiresAt = this.getRefreshExpiresAt()

    // Atomic claim: the single gate — only one concurrent request wins.
    // deleteByFamilyId (family wipe on reuse) runs regardless of the claim outcome.
    const { count } = await this.sessions.claim(sess.id)

    if (count === 0) {
      // Either already used (reuse attack) or expired — wipe the entire family
      // to invalidate all tokens in the chain, then deny.
      await this.sessions.deleteByFamilyId(sess.familyId)
      this.clearCookies(res)
      throw new UnauthorizedException()
    }

    const user = await this.usersService.findOne(sess.userId)

    await this.sessions.create({
      userId: user.id,
      familyId: sess.familyId,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt,
      ...this.getSessionMeta(req),
    })

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
      // deleteByRefreshTokenHash — не бросает ошибку если сессия уже удалена
      // (истекла, reuse detection, параллельный logout)
      await this.sessions.deleteByRefreshTokenHash(tokenHash)
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

    await this.sessions.create({
      userId: user.id,
      familyId: randomUUID(),
      refreshTokenHash,
      expiresAt,
      ...this.getSessionMeta(req),
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
