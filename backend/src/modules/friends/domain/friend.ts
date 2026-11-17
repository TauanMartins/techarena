import type { Page } from '../../../common/domain/pagination.js';
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
