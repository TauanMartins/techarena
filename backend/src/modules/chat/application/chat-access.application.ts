import { DomainError } from '../../../common/domain/domain-error.js';
import { InvalidChatTopicError, parseChatTopic } from '../domain/chat-topic.js';
import type { ChatAccessPort } from './chat-access.port.js';
import type {
  ChatAuthorization,
  ChatProvisioning,
} from './chat-gateways.port.js';

export class ChatAccessApplication implements ChatAccessPort {
  constructor(
    private readonly authorization: ChatAuthorization,
    private readonly provisioning: ChatProvisioning,
  ) {}
  async ensureAccess(userId: string, rawTopic: string) {
    let topic: ReturnType<typeof parseChatTopic>;
    try {
      topic = parseChatTopic(rawTopic);
    } catch (error) {
      if (error instanceof InvalidChatTopicError)
        throw new DomainError('invalid', 'INVALID_CHAT_TOPIC', error.message);
      throw error;
    }
    if (!(await this.authorization.isAllowed(userId, topic))) {
      await this.provisioning.revokeParticipant(topic.topic, userId);
      throw new DomainError(
        'forbidden',
        'CHAT_ACCESS_DENIED',
        'Você não participa desta conversa ou não tem mais acesso a ela.',
      );
    }
    const displayName = (await this.authorization.displayName(userId)).slice(
      0,
      150,
    );
    await this.provisioning.grant(topic, userId, displayName);
    // Membership may have changed during the remote call. Fail closed and compensate.
    try {
      if (!(await this.authorization.isAllowed(userId, topic)))
        throw new DomainError(
          'forbidden',
          'CHAT_ACCESS_REVOKED',
          'Seu acesso à conversa foi removido durante a autorização.',
        );
    } catch (error) {
      await this.provisioning.revokeParticipant(topic.topic, userId);
      throw error;
    }
    return { topic: topic.topic, kind: topic.kind };
  }
  revokeParticipant(topic: string, userId: string) {
    return this.provisioning.revokeParticipant(topic, userId);
  }
}
