export type ConversationKind = 'direct' | 'team' | 'appointment';

export function conversationTopic(
  kind: ConversationKind,
  entityId: string,
  otherUserId?: string,
): string {
  if (kind !== 'direct') return `${kind}:${entityId}`;
  if (!otherUserId)
    throw new Error(
      'Uma conversa direta exige o identificador do outro atleta.',
    );
  const [first, second] = [
    entityId.toLowerCase(),
    otherUserId.toLowerCase(),
  ].sort();
  return `direct:${first}:${second}`;
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  createdAt: string;
}

export function chatMessageFromRow(value: unknown): ChatMessage | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    typeof row.sender_id !== 'string' ||
    typeof row.sender_name !== 'string' ||
    typeof row.body !== 'string' ||
    typeof row.created_at !== 'string'
  ) {
    return null;
  }
  return {
    id: row.id,
    userId: row.sender_id,
    name: row.sender_name,
    text: row.body,
    createdAt: row.created_at,
  };
}

export function mergeChatMessages(
  current: ChatMessage[],
  additions: ChatMessage[],
) {
  const messages = new Map(current.map((message) => [message.id, message]));
  for (const message of additions) messages.set(message.id, message);
  return [...messages.values()].sort(
    (first, second) =>
      first.createdAt.localeCompare(second.createdAt) ||
      first.id.localeCompare(second.id),
  );
}

export function otherOnlineParticipantIds(
  presence: Record<string, unknown>,
  currentUserId: string,
): string[] {
  const currentId = currentUserId.toLowerCase();
  const participantIds = Object.entries(presence).flatMap(([key, value]) => {
    const records = Array.isArray(value) ? value : [value];
    return records.map((record) => {
      if (
        typeof record === 'object' &&
        record !== null &&
        'userId' in record &&
        typeof record.userId === 'string'
      ) {
        return record.userId;
      }
      return key;
    });
  });

  return [...new Set(participantIds.map((id) => id.toLowerCase()))].filter(
    (id) => id.toLowerCase() !== currentId,
  );
}
