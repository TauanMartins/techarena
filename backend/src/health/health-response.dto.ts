import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Equals, IsString } from 'class-validator';

export class HealthResponseDto {
  /** Backend package version published by the release pipeline. */
  @ApiProperty({
    description: 'Versão do backend publicada.',
    example: '1.2.3',
  })
  @Expose()
  @IsString()
  version!: string;

  /** Application and database are available. */
  @Expose()
  @Equals('ok')
  status!: 'ok';

  @Expose()
  @Equals('up')
  database!: 'up';
}
