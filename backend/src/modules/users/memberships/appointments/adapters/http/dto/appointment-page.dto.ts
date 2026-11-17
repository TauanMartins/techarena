import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../shared/http/dto/pagination.dto.js';
import { AppointmentResponseDto } from './appointment-response.dto.js';
export class AppointmentPageDto extends PageResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentResponseDto)
  items!: AppointmentResponseDto[];
}
