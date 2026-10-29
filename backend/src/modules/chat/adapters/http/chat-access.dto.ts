import { Expose } from 'class-transformer';
import { IsIn, IsString, MaxLength } from 'class-validator';
import type { ChatKind } from '../../domain/chat-topic.js';

export class ChatAccessRequestDto {
  @IsString()
  @MaxLength(200)
  topic!: string;
}

export class ChatAccessResponseDto {
  @Expose()
  @IsString()
  topic!: string;

  @Expose()
  @IsIn(['direct', 'team', 'appointment'])
  kind!: ChatKind;
}
