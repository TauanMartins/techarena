import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDefined, IsIn, ValidateNested } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { UserCardDto } from '../../../../../common/http/dto/user-card.dto.js';

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
