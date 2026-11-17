import { apiRequest } from './api-request';
export const chatClient = {
  ensureChatAccess: (token: string, topic: string) =>
    apiRequest<{ topic: string; kind: 'direct' | 'team' | 'appointment' }>(
      '/chat/access',
      token,
      {
        method: 'POST',
        body: JSON.stringify({ topic }),
      },
    ),
};
