import { Expose } from 'class-transformer';
import { IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UserCardDto {
  @Expose()
  @IsUUID()
  id!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  @MaxLength(150)
  name!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  @MaxLength(45)
  username!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  @MaxLength(150)
  image!: string | null;
}
