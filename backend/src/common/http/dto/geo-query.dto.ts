import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from './pagination.dto.js';
export class GeoPageQueryDto extends PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) lat?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  @Max(1000)
  radiusKm?: number;
}
