import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '../../../shared/http/pagination.dto.js';
import { UserCardDto } from '../../../shared/http/user-card.dto.js';
export class UserPageDto extends PageResponseDto {
  @ApiProperty({ type: [UserCardDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserCardDto)
  items!: UserCardDto[];
}
