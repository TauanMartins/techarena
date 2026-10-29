import { useQuery } from "@tanstack/react-query";
import { api } from "../../shared/api";
import { queryKeys } from "../../shared/queryClient";
import { buildConversations } from "./conversations";

export function useChatConversations(token: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.chatConversations(userId),
    queryFn: async () => {
      const [friends, teams, appointments] = await Promise.all([
        api.listFriends(token),
        api.listMyTeams(token),
        api.listMyAppointments(token),
      ]);
      return buildConversations(friends, teams.items, appointments.items);
    },
  });
}
