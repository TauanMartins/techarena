import { useChatConversations as useConversationsQuery } from '../api/chat.api';

export function useChatConversations(token: string, userId: string) {
  return useConversationsQuery(token, userId);
}
