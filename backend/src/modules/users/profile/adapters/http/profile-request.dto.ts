import { Transform } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
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
