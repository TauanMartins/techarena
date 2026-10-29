export type ChatKind = 'direct' | 'team' | 'appointment';

export class InvalidChatTopicError extends Error {}

export type ParsedChatTopic =
  | {
    kind: 'direct';
    topic: string;
    participants: [string, string];
  }
  | {
    kind: 'team';
    topic: string;
    entityId: string;
  }
  | {
    kind: 'appointment';
    topic: string;
    entityId: string;
  };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const bigintPattern = /^[1-9]\d{0,18}$/;
const maxBigint = 9223372036854775807n;

export function directChatTopic(firstUserId: string, secondUserId: string) {
  const [first, second] = [firstUserId.toLowerCase(), secondUserId.toLowerCase()].sort();
  return `direct:${first}:${second}`;
}

export function parseChatTopic(value: string): ParsedChatTopic {
  const parts = value.split(':');
  if (parts[0] === 'direct' && parts.length === 3) {
    const [, first, second] = parts;
    if (
      !uuidPattern.test(first) ||
      !uuidPattern.test(second) ||
      first >= second
    ) {
      throw new InvalidChatTopicError('O tópico de conversa direta é inválido.');
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
