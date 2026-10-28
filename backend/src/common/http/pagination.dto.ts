import { Type, Expose } from 'class-transformer';
import { IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
export class PageResponseDto {
  @Expose()
  @IsInt()
  @Min(0)
  totalPages!: number;
  @Expose()
  @IsBoolean()
  hasNextPage!: boolean;
  @Expose()
  @IsBoolean()
  hasPreviousPage!: boolean;

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
