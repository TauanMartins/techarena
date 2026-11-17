import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsISO8601, IsString, IsUUID, ValidateIf } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class MembershipRequestDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsBigintId() teamId!: string;
  @Expose() @IsString() teamName!: string;
  @Expose() @IsUUID() userId!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  userName!: string | null;
  @Expose() @IsUUID() createdBy!: string;
  @Expose() @IsIn(['invitation', 'request']) kind!: 'invitation' | 'request';
  @Expose() @IsIn(['pending', 'accepted', 'declined']) status!:
    'pending' | 'accepted' | 'declined';
  @Expose() @IsISO8601() createdAt!: string;
}
