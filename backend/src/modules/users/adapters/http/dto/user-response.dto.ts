import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class UserCardDto {
  @Expose()
  @IsUUID()
  id!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  @MaxLength(150)
  name!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  @MaxLength(45)
  username!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  @MaxLength(150)
  image!: string | null;
}
export class UserProfileDto extends UserCardDto {
  /** Read-only application permission; never obtained from user_metadata. */
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  permission!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsEmail()
  email!: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date' })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsISO8601({ strict: true })
  birthDate!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  @MaxLength(1)
  gender!: string | null;
  @Expose()
  @IsISO8601({ strict: true })
  createdAt!: string;
}
export class PageResponseDto {
  @Expose()
  @IsInt()
  @Min(0)
  total!: number;
  @Expose()
  @IsInt()
  @Min(1)
  page!: number;
  @Expose()
  @IsInt()
  @Min(1)
  limit!: number;
}
export class UserPageDto extends PageResponseDto {
  @ApiProperty({ type: [UserCardDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserCardDto)
  items!: UserCardDto[];
}
export class ThemeResponseDto {
  @Expose()
  @IsIn(['light', 'dark', 'system'])
  theme!: 'light' | 'dark' | 'system';
}
export class SportResponseDto {
  @Expose()
  @IsBigintId()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
}
export class FavoriteSportsDto {
  @ApiProperty({ type: [SportResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SportResponseDto)
  items!: SportResponseDto[];
}
export class TeamResponseDto {
  @Expose()
  @IsBigintId()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsString()
  role!: string;
}
export class TeamPageDto extends PageResponseDto {
  @ApiProperty({ type: [TeamResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamResponseDto)
  items!: TeamResponseDto[];
}
export class AppointmentResponseDto {
  @Expose()
  @IsBigintId()
  id!: string;
  @Expose()
  @IsString()
  title!: string;
  @Expose()
  @IsISO8601({ strict: true })
  scheduledAt!: string;
  @Expose()
  @IsIn(['scheduled', 'in_progress', 'finished', 'canceled'])
  status!: string;
  @Expose()
  @IsBoolean()
  holder!: boolean;
}
export class AppointmentPageDto extends PageResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentResponseDto)
  items!: AppointmentResponseDto[];
}
