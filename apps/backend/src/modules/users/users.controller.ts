import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { User } from './user.entity'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): User[] {
    return this.usersService.findAll()
  }

  @Post()
  create(@Body() dto: CreateUserDto): User {
    return this.usersService.create(dto)
  }

  @Get(':id')
  findOne(@Param('id') id: string): User {
    return this.usersService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateUserDto): User {
    return this.usersService.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.usersService.remove(id)
  }
}
