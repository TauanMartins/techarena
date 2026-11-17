import type { ChatKind } from '../../domain/chat-topic.js';

export interface ChatAccessPort {
  ensureAccess(
    userId: string,
    topic: string,
  ): Promise<{ topic: string; kind: ChatKind }>;
  revokeParticipant(topic: string, userId: string): Promise<void>;
}

export const CHAT_ACCESS = Symbol('CHAT_ACCESS');
