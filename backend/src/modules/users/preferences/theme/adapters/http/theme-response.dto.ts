import { Expose } from 'class-transformer';
import { IsIn } from 'class-validator';

export class ThemeResponseDto {
  @Expose()
  @IsIn(['light', 'dark', 'system'])
  theme!: 'light' | 'dark' | 'system';
}
