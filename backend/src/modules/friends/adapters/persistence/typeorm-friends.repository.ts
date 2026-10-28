import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { Friend, User } from '../../../../database/entities/index.js';
import { DomainError } from '../../../../common/domain/domain-error.js';
import { paginate } from '../../../../common/domain/pagination.js';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import type {
  FriendsRepository,
  FriendView,
} from '../../domain/friends.port.js';
import { assertFriendDecision } from '../../domain/friend-policy.js';
function view(row: Friend, actor: string): FriendView {
  const user = actor === row.requesterId ? row.addressee : row.requester;
  return {
    id: row.id,
    status: row.status,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
    },
  };
}
export class TypeormFriendsRepository implements FriendsRepository {
  constructor(private readonly source: DataSource) {}
  private async present(m: EntityManager, id: string, actor: string) {
    const row = await m.getRepository(Friend).findOneOrFail({
      where: { id },
      relations: { requester: true, addressee: true },
    });
    return view(row, actor);
  }
  private async group(
    actor: string,
    query: PageRequest,
    kind: 'friends' | 'sent' | 'received',
  ) {
    const q = this.source
      .getRepository(Friend)
      .createQueryBuilder('friend')
      .innerJoinAndSelect('friend.requester', 'requester')
      .innerJoinAndSelect('friend.addressee', 'addressee');
    if (kind === 'friends')
      q.where(
        "friend.status='accepted' AND (friend.requesterId=:actor OR friend.addresseeId=:actor)",
        { actor },
      );
    if (kind === 'sent')
      q.where("friend.status='pending' AND friend.requesterId=:actor", {
        actor,
      });
    if (kind === 'received')
      q.where("friend.status='pending' AND friend.addresseeId=:actor", {
        actor,
      });
    const [rows, total] = await q
      .orderBy('friend.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(
      rows.map((row) => view(row, actor)),
      total,
      query,
    );
  }
  async list(actor: string, query: PageRequest) {
    const [friends, requestedFriends, receivedFriends] = await Promise.all([
      this.group(actor, query, 'friends'),
      this.group(actor, query, 'sent'),
      this.group(actor, query, 'received'),
    ]);
    return { friends, requestedFriends, receivedFriends };
  }
  request(actor: string, userId: string) {
    return databaseWrite(() =>
      this.source.transaction(async (m) => {
        if (!(await m.getRepository(User).existsBy({ id: userId })))
          throw new DomainError(
            'not_found',
            'USER_NOT_FOUND',
            'User not found',
          );
        if (
          await m
            .getRepository(Friend)
            .createQueryBuilder('f')
            .where(
              '(f.requesterId=:actor AND f.addresseeId=:userId) OR (f.requesterId=:userId AND f.addresseeId=:actor)',
              { actor, userId },
            )
            .getExists()
        )
          throw new DomainError(
            'conflict',
            'RELATIONSHIP_EXISTS',
            'A relationship already exists',
          );
        const row = await m.getRepository(Friend).save({
          requesterId: actor,
          addresseeId: userId,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return this.present(m, row.id, actor);
      }),
    );
  }
  decide(actor: string, id: string, action: 'accept' | 'block') {
    return databaseWrite(() =>
      this.source.transaction(async (m) => {
        const row = await m
          .getRepository(Friend)
          .findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
        if (!row)
          throw new DomainError(
            'not_found',
            'FRIEND_NOT_FOUND',
            'Friend relationship not found',
          );
        assertFriendDecision(actor, row, action);
        await m.getRepository(Friend).update(id, {
          status: action === 'accept' ? 'accepted' : 'blocked',
          updatedAt: new Date(),
        });
        return this.present(m, id, actor);
      }),
    );
  }
}
