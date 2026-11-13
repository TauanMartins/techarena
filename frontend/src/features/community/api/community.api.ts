import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { queryKeys } from '../../../lib/query-client';

export const communityApi = {
  listFriends: api.listFriends,
  searchUsers: api.searchUsers,
  requestFriend: api.requestFriend,
  decideFriend: api.decideFriend,
};

export function useFriendGroups(token: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.community(userId),
    queryFn: () => communityApi.listFriends(token),
  });
}

export function useAthleteDirectory(
  token: string,
  userId: string,
  search: string,
) {
  return useQuery({
    queryKey: queryKeys.directory(userId, search),
    queryFn: async () =>
      (await communityApi.searchUsers(token, search)).items.filter(
        (person) => person.id !== userId,
      ),
    enabled: search.length >= 2,
  });
}

export function useFriendMutations(token: string, userId: string) {
  const client = useQueryClient();
  const refreshFriends = () =>
    client.invalidateQueries({ queryKey: queryKeys.community(userId) });
  const refreshDecisions = () =>
    Promise.all([
      refreshFriends(),
      client.invalidateQueries({
        queryKey: queryKeys.chatConversations(userId),
      }),
    ]);
  return {
    request: useMutation({
      mutationFn: (friendId: string) =>
        communityApi.requestFriend(token, friendId),
      onSuccess: refreshFriends,
    }),
    decide: useMutation({
      mutationFn: ({
        friendId,
        action,
      }: {
        friendId: string;
        action: 'accept' | 'block';
      }) => communityApi.decideFriend(token, friendId, action),
      onSuccess: refreshDecisions,
    }),
  };
}
