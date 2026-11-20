import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'
import { lowercaseString, trimString } from '../../../common/transforms/string.transforms'
import { MaxByteLength } from './max-byte-length.validator'

export class RegisterDto {
  @ApiProperty({ example: 'Alice' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @ApiProperty({ example: 'alice@example.com' })
  @Transform(lowercaseString)
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'supersecret' })
  @IsString()
  @MinLength(8)
  // bcrypt хэширует только первые 72 байта UTF-8 — MaxLength(72) считал бы
  // символы и пропустил бы многобайтовый пароль длиннее лимита незаметно для bcrypt.
  @MaxByteLength(72)
  password!: string
}
