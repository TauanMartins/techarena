import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../common/http/dto/pagination.dto.js';
import { FriendDto } from './friend.dto.js';
export class FriendPageDto extends PageResponseDto {
  @ApiProperty({ type: [FriendDto] })
  @Expose()
  @IsArray()
  @Type(() => FriendDto)
  @ValidateNested({ each: true })
  items!: FriendDto[];
}
