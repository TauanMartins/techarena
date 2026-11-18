import type { EntityManager } from 'typeorm';
import { DataSource } from 'typeorm';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import { paginate } from '../../../../common/domain/pagination.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import { Friend, User } from '../../../../database/entities/index.js';
import type {
  FriendshipTransaction,
  FriendsRepository,
} from '../../application/ports/friends.port.js';
import type { FriendView } from '../../domain/friend.js';
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
  transaction<T>(
    work: (store: FriendshipTransaction) => Promise<T>,
  ): Promise<T> {
    return databaseWrite(() =>
      this.source.transaction((m) =>
        work({
          remove: async (id) => {
            await m.getRepository(Friend).delete({ id });
          },
          userExists: (id) => m.getRepository(User).existsBy({ id }),
          relationshipExists: (actor, userId) =>
            m
              .getRepository(Friend)
              .createQueryBuilder('f')
              .where(
                '(f.requesterId=:actor AND f.addresseeId=:userId) OR (f.requesterId=:userId AND f.addresseeId=:actor)',
                { actor, userId },
              )
              .getExists(),
          lock: (id) =>
            m
              .getRepository(Friend)
              .findOne({ where: { id }, lock: { mode: 'pessimistic_write' } }),
          insert: async (requesterId, addresseeId) =>
            (
              await m.getRepository(Friend).save({
                requesterId,
                addresseeId,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            ).id,
          setStatus: async (id, status) => {
            await m
              .getRepository(Friend)
              .update(id, { status, updatedAt: new Date() });
          },
          present: (id, actor) => this.present(m, id, actor),
        }),
      ),
    );
  }
}
