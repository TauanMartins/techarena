import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../../../common/http/dto/pagination.dto.js';

export class SportsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @Length(1, 100) search?: string;
}
