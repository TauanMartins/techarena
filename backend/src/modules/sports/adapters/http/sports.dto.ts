import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../common/http/bigint-id.validator.js';
import {
  PaginationQueryDto,
  PageResponseDto,
} from '../../../../common/http/pagination.dto.js';
export class SportsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @Length(1, 100) search?: string;
}
export class ArenaSportsQueryDto extends PaginationQueryDto {
  @IsBigintId() arenaId!: string;
}
export class SportMaterialsQueryDto extends PaginationQueryDto {
  @IsBigintId() sportId!: string;
}
export class SportDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() name!: string;
  @Expose() @IsInt() @Min(1) defaultPlayers!: number;
}
export class MaterialDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() description!: string;
  @Expose() @IsBoolean() relatedToLocal!: boolean;
}
export class SportPageDto extends PageResponseDto {
  @ApiProperty({ type: [SportDto] })
  @Expose()
  @IsArray()
  @Type(() => SportDto)
  @ValidateNested({ each: true })
  items!: SportDto[];
}
export class MaterialPageDto extends PageResponseDto {
  @ApiProperty({ type: [MaterialDto] })
  @Expose()
  @IsArray()
  @Type(() => MaterialDto)
  @ValidateNested({ each: true })
  items!: MaterialDto[];
}
