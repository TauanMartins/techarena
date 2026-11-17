import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { FriendPageDto } from './friend-page.dto.js';
export class FriendGroupsDto {
  @ApiProperty({ type: FriendPageDto })
  @Expose()
  @Type(() => FriendPageDto)
  @IsDefined()
  @ValidateNested()
  friends!: FriendPageDto;
  @ApiProperty({ type: FriendPageDto })
  @Expose()
  @Type(() => FriendPageDto)
  @IsDefined()
  @ValidateNested()
  requestedFriends!: FriendPageDto;
  @ApiProperty({ type: FriendPageDto })
  @Expose()
  @Type(() => FriendPageDto)
  @IsDefined()
  @ValidateNested()
  receivedFriends!: FriendPageDto;
}
