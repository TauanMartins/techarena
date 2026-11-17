import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../../shared/http/dto/pagination.dto.js';

export class AppointmentMembershipQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'finished', 'canceled'])
  status?: 'scheduled' | 'in_progress' | 'finished' | 'canceled';
  /** Accepts only true or false, never JavaScript truthiness. */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  holder?: boolean;
  @ApiPropertyOptional({ format: 'date-time', example: '2026-11-01T00:00:00Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  from?: string;
  @ApiPropertyOptional({ format: 'date-time', example: '2026-12-01T00:00:00Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  to?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
