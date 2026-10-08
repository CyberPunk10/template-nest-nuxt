import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ example: 'Alice' })
  @IsString()
  @MinLength(2)
  name!: string

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'supersecret' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string
}
