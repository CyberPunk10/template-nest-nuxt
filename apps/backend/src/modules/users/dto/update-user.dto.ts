import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { lowercaseString, trimString } from '../../../common/transforms/string.transforms'

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alice' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ example: 'alice@example.com' })
  @IsOptional()
  @Transform(lowercaseString)
  @IsEmail()
  @MaxLength(254)
  email?: string
}
