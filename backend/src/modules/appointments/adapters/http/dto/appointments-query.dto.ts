import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { GeoPageQueryDto } from '../../../../../common/http/dto/geo-query.dto.js';

export class AppointmentsQueryDto extends GeoPageQueryDto {
  @ApiPropertyOptional({ enum: ['upcoming', 'past'] })
  @IsOptional()
  @IsIn(['upcoming', 'past'])
  period?: 'upcoming' | 'past';
  @IsOptional() @IsBigintId() sportId?: string;
  @IsOptional() @IsBigintId() arenaId?: string;
  @ApiPropertyOptional({ default: false })
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  preferSports: boolean = false;
  @ApiPropertyOptional({ enum: ['recent', 'future'], default: 'recent' })
  @IsIn(['recent', 'future'])
  orderByTime: 'recent' | 'future' = 'recent';
  @ApiPropertyOptional({ enum: ['near', 'far'], default: 'near' })
  @IsIn(['near', 'far'])
  distance: 'near' | 'far' = 'near';
}
