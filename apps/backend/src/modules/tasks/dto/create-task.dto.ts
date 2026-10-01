import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { trimString } from '../../../common/transforms/string.transforms'

export class CreateTaskDto {
  @ApiProperty({ example: 'Название задачи' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string

  @ApiPropertyOptional({ example: 'Описание задачи' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string
}
