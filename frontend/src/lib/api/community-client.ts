import type { FriendGroups, Page, UserCard } from '../../shared/types';
import { apiRequest } from './api-request';
import { queryString } from './query-string';
export const communityClient = {
  searchUsers: (token: string, search: string) =>
    apiRequest<Page<UserCard>>(
      `/users${queryString({ page: 1, limit: 20, search })}`,
      token,
    ),
  listFriends: (token: string) =>
    apiRequest<FriendGroups>('/friend?page=1&limit=50', token),
  requestFriend: (token: string, userId: string) =>
    apiRequest('/friend', token, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  decideFriend: (token: string, friendId: string, action: 'accept' | 'block') =>
    apiRequest('/friend', token, {
      method: 'PUT',
      body: JSON.stringify({ friendId, action }),
    }),
};
