import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { queryKeys } from '../../../lib/query-client';
import { buildConversations } from '../types/conversation.types';

export const chatApi = {
  ensureAccess: api.ensureChatAccess,
  friends: api.listFriends,
  teams: api.listMyTeams,
  appointments: api.listMyAppointments,
};

export function useChatConversations(token: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.chatConversations(userId),
    queryFn: async () => {
      const [friends, teams, appointments] = await Promise.all([
        chatApi.friends(token),
        chatApi.teams(token),
        chatApi.appointments(token),
      ]);
      return buildConversations(friends, teams.items, appointments.items);
    },
  });
}
