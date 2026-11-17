import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsString, IsUUID, ValidateIf } from 'class-validator';

export class AppointmentParticipantDto {
  @Expose() @IsUUID() id!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  name!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  username!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  image!: string | null;
  @Expose() @IsBoolean() holder!: boolean;
}
