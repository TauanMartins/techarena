import { IsString, MaxLength } from 'class-validator';

export class ChatAccessRequestDto {
  @IsString()
  @MaxLength(200)
  topic!: string;
}
