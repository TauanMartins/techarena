import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../common/http/dto/pagination.dto.js';
import { BookingDto } from './booking.dto.js';
export class BookingPageDto extends PageResponseDto {
  @ApiProperty({ type: [BookingDto] })
  @Expose()
  @IsArray()
  @Type(() => BookingDto)
  @ValidateNested({ each: true })
  items!: BookingDto[];
}
