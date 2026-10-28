import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginationQueryDto,
  PageResponseDto,
} from '../../../../common/http/pagination.dto.js';
import { IsBigintId } from '../../../../common/http/bigint-id.validator.js';
export class TeamQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @Length(1, 100) search?: string;
}
export class TeamNameQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 45)
  name!: string;
}
export class CreateTeamDto extends TeamNameQueryDto {
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null;
  @ApiProperty({ type: String, nullable: true, required: false })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(255)
  image?: string | null;
}
export class UpdateTeamDto extends CreateTeamDto {
  @IsBigintId() teamId!: string;
}
export class InviteMemberDto {
  @IsBigintId() teamId!: string;
  @IsUUID() userId!: string;
}
export class DecideMemberDto extends InviteMemberDto {
  @ApiPropertyOptional({ enum: ['accept', 'decline'], default: 'accept' })
  @IsIn(['accept', 'decline'])
  action: 'accept' | 'decline' = 'accept';
}
export class JoinTeamDto {
  @IsBigintId() teamId!: string;
}
export class DecisionDto {
  @IsIn(['accept', 'decline']) action!: 'accept' | 'decline';
}
export class RequestIdDto {
  @IsBigintId() requestId!: string;
}
export class TeamRequestQueryDto extends PaginationQueryDto {
  @IsBigintId() teamId!: string;
}
export class TeamDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() name!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  description!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  image!: string | null;
  @Expose() @IsISO8601() createdAt!: string;
}
export class TeamExistsDto {
  @Expose() @IsBoolean() exists!: boolean;
}
export class TeamPageDto extends PageResponseDto {
  @ApiProperty({ type: [TeamDto] })
  @Expose()
  @IsArray()
  @Type(() => TeamDto)
  @ValidateNested({ each: true })
  items!: TeamDto[];
}
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
export class MembershipRequestPageDto extends PageResponseDto {
  @ApiProperty({ type: [MembershipRequestDto] })
  @Expose()
  @IsArray()
  @Type(() => MembershipRequestDto)
  @ValidateNested({ each: true })
  items!: MembershipRequestDto[];
}
