import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor(config: ConfigService) {
    const user = config.getOrThrow<string>('POSTGRES_USER')
    const password = config.getOrThrow<string>('POSTGRES_PASSWORD')
    const host = config.getOrThrow<string>('POSTGRES_HOST')
    const port = config.getOrThrow<number>('POSTGRES_PORT')
    const db = config.getOrThrow<string>('POSTGRES_DB')
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${db}?schema=public`
    super({ adapter: new PrismaPg({ connectionString }) })
  }

  async onModuleInit() {
    try {
      await this.$connect()
      // SELECT 1 — standard ping verifying a real TCP connection
      await this.$queryRaw`SELECT 1`
      this.logger.log('✅ Connected to PostgreSQL')
    } catch (err) {
      this.logger.error('❌ Failed to connect to PostgreSQL', err)
      process.exit(1)
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('👋 Disconnected from PostgreSQL')
  }
}
