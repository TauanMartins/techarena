import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { PageResponseDto } from '../../../../shared/http/dto/pagination.dto.js';
import { UserCardDto } from '../../../../shared/http/dto/user-card.dto.js';
export class UserPageDto extends PageResponseDto {
  @ApiProperty({ type: [UserCardDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserCardDto)
  items!: UserCardDto[];
}
