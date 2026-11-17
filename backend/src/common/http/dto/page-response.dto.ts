import { Expose } from 'class-transformer';
import { IsBoolean, IsInt, Min } from 'class-validator';

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
