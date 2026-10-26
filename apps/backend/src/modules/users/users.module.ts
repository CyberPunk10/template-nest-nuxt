import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { UsersSeedService } from './users-seed.service'

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersSeedService],
  exports: [UsersService],
})
export class UsersModule {}
