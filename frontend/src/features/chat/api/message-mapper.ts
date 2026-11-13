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
