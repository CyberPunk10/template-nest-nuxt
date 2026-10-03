import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsString } from 'class-validator'
import { lowercaseString } from '../../../common/transforms/string.transforms'
import { MaxByteLength } from './max-byte-length.validator'

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @Transform(lowercaseString)
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'supersecret' })
  @IsString()
  // bcrypt хэширует только первые 72 байта UTF-8 — см. register.dto.ts
  @MaxByteLength(72)
  password!: string
}
