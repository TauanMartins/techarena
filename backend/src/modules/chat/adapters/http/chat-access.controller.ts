import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiEndpoint } from '../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../auth/domain/access-token-verifier.port.js';
import { CHAT_ACCESS } from '../../application/chat-access.port.js';
import type { ChatAccessPort } from '../../application/chat-access.port.js';
import {
  ChatAccessRequestDto,
  ChatAccessResponseDto,
} from './chat-access.dto.js';

@ApiEndpoint('chat/access')
@Controller('chat')
export class ChatAccessController {
  constructor(
    @Inject(CHAT_ACCESS) private readonly chatAccess: ChatAccessPort,
  ) {}

  @Post('access')
  @HttpCode(200)
  @ResponseContract(ChatAccessResponseDto)
  ensureAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChatAccessRequestDto,
  ) {
    return this.chatAccess.ensureAccess(user.id, body.topic);
  }
}
