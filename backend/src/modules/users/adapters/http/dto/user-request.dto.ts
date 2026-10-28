import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class InitializeProfileDto {}

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 10000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
export class SearchUsersQueryDto extends PaginationQueryDto {
  /** Search by username or display name. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  search!: string;
}
export class UpdateProfileDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 150)
  name?: string;

  /** Lowercase letters, digits and underscores. */
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(3, 45)
  @Matches(/^[a-z0-9_]+$/)
  username?: string;

  /** Real calendar date, YYYY-MM-DD; minimum age is 18. */
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  birthDate?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['M', 'F', 'O'])
  gender?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 150 })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(150)
  image?: string | null;
}
export class UpdateThemeDto {
  @IsIn(['light', 'dark', 'system'])
  theme!: 'light' | 'dark' | 'system';
}
export class ReplaceSportsDto {
  @ApiProperty({
    type: [String],
    maxItems: 4,
    uniqueItems: true,
    example: ['1', '2'],
  })
  @IsArray()
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsBigintId({ each: true })
  sportIds!: string[];
}
export class AppointmentIdDto {
  @IsBigintId()
  appointmentId!: string;
}
export class JoinAppointmentDto {
  /** Starting player; false registers as a reserve. */
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  holder: boolean = true;
}
