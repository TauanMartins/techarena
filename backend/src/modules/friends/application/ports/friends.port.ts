import type { PageRequest } from '../../../../common/domain/pagination.js';
import type { FriendGroups, FriendView } from '../../domain/friend.js';
export const FRIENDS_REPOSITORY = Symbol('FRIENDS_REPOSITORY');
export interface FriendshipState {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
}
export interface FriendshipTransaction {
  remove(id: string): Promise<void>;
  userExists(id: string): Promise<boolean>;
  relationshipExists(first: string, second: string): Promise<boolean>;
  lock(id: string): Promise<FriendshipState | null>;
  insert(first: string, second: string): Promise<string>;
  setStatus(id: string, status: 'accepted' | 'blocked'): Promise<void>;
  present(id: string, actor: string): Promise<FriendView>;
}
export interface FriendsRepository {
  list(actor: string, query: PageRequest): Promise<FriendGroups>;
  transaction<T>(
    work: (store: FriendshipTransaction) => Promise<T>,
  ): Promise<T>;
}
