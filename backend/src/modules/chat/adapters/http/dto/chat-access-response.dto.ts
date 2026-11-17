import { Expose } from 'class-transformer';
import { IsIn, IsString } from 'class-validator';
import type { ChatKind } from '../../../domain/chat-topic.js';

export class ChatAccessResponseDto {
  @Expose()
  @IsString()
  topic!: string;

  @Expose()
  @IsIn(['direct', 'team', 'appointment'])
  kind!: ChatKind;
}
