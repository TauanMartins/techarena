import type { Page, PageRequest } from '../../../common/domain/pagination.js';
export interface FriendView {
  id: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}
export interface FriendGroups {
  friends: Page<FriendView>;
  requestedFriends: Page<FriendView>;
  receivedFriends: Page<FriendView>;
}
export const FRIENDS_REPOSITORY = Symbol('FRIENDS_REPOSITORY');
export interface FriendsRepository {
  list(actor: string, query: PageRequest): Promise<FriendGroups>;
  request(actor: string, userId: string): Promise<FriendView>;
  decide(
    actor: string,
    id: string,
    action: 'accept' | 'block',
  ): Promise<FriendView>;
}
