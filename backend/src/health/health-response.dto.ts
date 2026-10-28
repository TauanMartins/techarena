import { Expose } from 'class-transformer';
import { Equals } from 'class-validator';

export class HealthResponseDto {
  /** Application and database are available. */
  @Expose()
  @Equals('ok')
  status!: 'ok';

  @Expose()
  @Equals('up')
  database!: 'up';
}
