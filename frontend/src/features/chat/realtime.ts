export type ConversationKind = 'direct' | 'team' | 'appointment';

export function conversationTopic(
  kind: ConversationKind,
  entityId: string,
  otherUserId?: string,
): string {
  if (kind !== 'direct') return `${kind}:${entityId}`;
  if (!otherUserId) throw new Error('Uma conversa direta exige o identificador do outro atleta.');
  const [first, second] = [entityId.toLowerCase(), otherUserId.toLowerCase()].sort();
  return `direct:${first}:${second}`;
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  createdAt: string;
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.id === 'string' &&
    typeof message.userId === 'string' &&
    typeof message.name === 'string' &&
    typeof message.text === 'string' &&
    typeof message.createdAt === 'string'
  );
}
