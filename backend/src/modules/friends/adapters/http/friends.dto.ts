import { Expose, Type } from 'class-transformer';
import { IsArray, IsIn, IsUUID, ValidateNested } from 'class-validator';
import { IsDefined } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageResponseDto } from '../../../../common/http/pagination.dto.js';
import { UserCardDto } from '../../../../common/http/user-card.dto.js';
import { IsBigintId } from '../../../../common/http/bigint-id.validator.js';
export class CreateFriendDto {
  @IsUUID() userId!: string;
}
export class UpdateFriendDto {
  @IsBigintId() friendId!: string;
  @ApiPropertyOptional({ enum: ['accept', 'block'], default: 'accept' })
  @IsIn(['accept', 'block'])
  action: 'accept' | 'block' = 'accept';
}
export class FriendDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsIn(['pending', 'accepted', 'blocked']) status!: string;
  @ApiProperty({ type: UserCardDto })
  @Expose()
  @Type(() => UserCardDto)
  @IsDefined()
  @ValidateNested()
  user!: UserCardDto;
}
export class FriendPageDto extends PageResponseDto {
  @ApiProperty({ type: [FriendDto] })
  @Expose()
  @IsArray()
  @Type(() => FriendDto)
  @ValidateNested({ each: true })
  items!: FriendDto[];
}
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
