import { IsIn } from 'class-validator';

export class DecisionDto {
  @IsIn(['accept', 'decline']) action!: 'accept' | 'decline';
}
