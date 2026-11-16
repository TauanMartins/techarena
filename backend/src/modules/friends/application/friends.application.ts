import {
  assertCanRequestFriendship,
  friendshipOutcome,
} from '../domain/friend-policy.js';
import { DomainError } from '../../../common/domain/domain-error.js';
import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { PageRequest } from '../../../common/domain/pagination.js';
import type { ProfileAccess } from '../../users/profile/application/profile-access.port.js';
import type { FriendsRepository } from '../application/friends.port.js';
import type { ChatAccessPort } from '../../chat/application/chat-access.port.js';
import { directChatTopic } from '../../chat/domain/chat-topic.js';
export class FriendsApplication {
  constructor(
    private readonly repository: FriendsRepository,
    private readonly profiles: ProfileAccess,
    private readonly chatAccess: ChatAccessPort,
  ) {}
  async list(actor: string, query: PageRequest) {
    await this.profiles.ensureExists(actor);
    assertPageRequest(query);
    return this.repository.list(actor, query);
  }
  async request(actor: string, userId: string) {
    await this.profiles.ensureExists(actor);
    if (actor === userId)
      throw new DomainError(
        'invalid',
        'SELF_FRIENDSHIP',
        'You cannot add yourself',
      );
    return this.repository.transaction(async (store) => {
      assertCanRequestFriendship(
        actor,
        userId,
        await store.userExists(userId),
        await store.relationshipExists(actor, userId),
      );
      return store.present(await store.insert(actor, userId), actor);
    });
  }
  async decide(actor: string, id: string, action: 'accept' | 'block') {
    await this.profiles.ensureExists(actor);
    const result = await this.repository.transaction(async (store) => {
      const status = friendshipOutcome(actor, await store.lock(id), action);
      await store.setStatus(id, status);
      return store.present(id, actor);
    });
    if (action === 'block') {
      const topic = directChatTopic(actor, result.user.id);
      await Promise.all([
        this.chatAccess.revokeParticipant(topic, actor),
        this.chatAccess.revokeParticipant(topic, result.user.id),
      ]);
    }
    return result;
  }
}
