import {
  bigintPattern,
  maxBigint,
  ParsedChatTopic,
  uuidPattern,
} from './chat-topic-types.js';
import { InvalidChatTopicError } from './invalid-chat-topic-error.js';
export function parseChatTopic(value: string): ParsedChatTopic {
  const parts = value.split(':');
  if (parts[0] === 'direct' && parts.length === 3) {
    const [, first, second] = parts;
    if (
      !uuidPattern.test(first) ||
      !uuidPattern.test(second) ||
      first >= second
    ) {
      throw new InvalidChatTopicError(
        'O tópico de conversa direta é inválido.',
      );
    }
    return { kind: 'direct', topic: value, participants: [first, second] };
  }
  if (
    (parts[0] === 'team' || parts[0] === 'appointment') &&
    parts.length === 2 &&
    bigintPattern.test(parts[1]) &&
    BigInt(parts[1]) <= maxBigint
  ) {
    if (parts[0] === 'team') {
      return { kind: 'team', topic: value, entityId: parts[1] };
    }
    return { kind: 'appointment', topic: value, entityId: parts[1] };
  }
  throw new InvalidChatTopicError('O tópico de conversa é inválido.');
}
