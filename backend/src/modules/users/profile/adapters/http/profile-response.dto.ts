import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsISO8601,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UserCardDto } from '../../../shared/http/user-card.dto.js';
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
