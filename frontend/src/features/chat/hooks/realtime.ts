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
