import type { ParsedChatTopic } from '../domain/chat-topic.js';
/** Read authoritative application membership, never trust stale remote membership. */
export interface ChatAuthorization {
  isAllowed(userId: string, topic: ParsedChatTopic): Promise<boolean>;
  displayName(userId: string): Promise<string>;
}
/** External messaging infrastructure; may fail independently of the application database. */
export interface ChatProvisioning {
  grant(
    topic: ParsedChatTopic,
    userId: string,
    displayName: string,
  ): Promise<void>;
  revokeParticipant(topic: string, userId: string): Promise<void>;
}
