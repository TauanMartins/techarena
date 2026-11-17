import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class TeamNameQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 45)
  name!: string;
}
