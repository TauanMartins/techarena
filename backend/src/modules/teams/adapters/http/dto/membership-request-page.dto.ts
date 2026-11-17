import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../common/http/dto/pagination.dto.js';
import { MembershipRequestDto } from './membership-request.dto.js';
export class MembershipRequestPageDto extends PageResponseDto {
  @ApiProperty({ type: [MembershipRequestDto] })
  @Expose()
  @IsArray()
  @Type(() => MembershipRequestDto)
  @ValidateNested({ each: true })
  items!: MembershipRequestDto[];
}
