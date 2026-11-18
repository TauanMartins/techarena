import type { EntityManager } from 'typeorm';
import { DataSource, IsNull } from 'typeorm';
import { DomainError } from '../../../../common/domain/domain-error.js';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import { paginate } from '../../../../common/domain/pagination.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import { escapeLike } from '../../../../common/persistence/queries.js';
import {
  Team,
  TeamMembershipRequest,
  User,
  UserTeam,
} from '../../../../database/entities/index.js';
import type {
  TeamsRepository,
  TeamTransaction,
} from '../../application/ports/teams.port.js';
import type {
  MembershipRequestView,
  TeamMemberView,
  TeamQuery,
} from '../../domain/team.js';
export class TypeormTeamsRepository implements TeamsRepository {
  constructor(private readonly source: DataSource) {}
  async list(query: TeamQuery) {
    const q = this.source
      .getRepository(Team)
      .createQueryBuilder('team')
      .where('team.archived_at IS NULL');
    if (query.search)
      q.andWhere('team.name ILIKE :search', {
        search: `%${escapeLike(query.search)}%`,
      });
    const [items, total] = await q
      .orderBy('team.name', 'ASC')
      .addOrderBy('team.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(
      items.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        image: t.image,
        createdAt: t.createdAt,
      })),
      total,
      query,
    );
  }
  exists(name: string) {
    return this.source
      .getRepository(Team)
      .createQueryBuilder('team')
      .where('lower(btrim(team.name))=lower(btrim(:name))', { name })
      .andWhere('team.archived_at IS NULL')
      .getExists();
  }
  private async captain(manager: EntityManager, actor: string, teamId: string) {
    if (
      !(await manager
        .getRepository(UserTeam)
        .existsBy({ teamId, userId: actor, role: 'captain' }))
    )
      throw new DomainError(
        'forbidden',
        'CAPTAIN_REQUIRED',
        'Only a team captain can perform this action',
      );
  }
  private async present(
    m: EntityManager,
    id: string,
  ): Promise<MembershipRequestView> {
    const row = await m
      .getRepository(TeamMembershipRequest)
      .findOneOrFail({ where: { id }, relations: { team: true, user: true } });
    return {
      id: row.id,
      teamId: row.teamId,
      teamName: row.team.name,
      userId: row.userId,
      userName: row.user.name,
      createdBy: row.createdBy,
      kind: row.kind,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
  transaction<T>(work: (store: TeamTransaction) => Promise<T>): Promise<T> {
    return databaseWrite(() =>
      this.source.transaction((m) =>
        work({
          memberIds: async (teamId) =>
            (
              await m
                .getRepository(UserTeam)
                .find({ where: { teamId }, select: { userId: true } })
            ).map((row) => row.userId),
          hasActiveCompetitions: async (teamId) => {
            const [row] = await m.query<{ linked: boolean }[]>(
              `SELECT EXISTS(SELECT 1 FROM public.league_team lt JOIN public.league l ON l.id=lt.league_id WHERE lt.team_id=$1 AND l.status IN ('open','active')) OR EXISTS(SELECT 1 FROM public.league_match lm JOIN public.league l ON l.id=lm.league_id WHERE (lm.home_team_id=$1 OR lm.away_team_id=$1) AND l.status IN ('open','active')) AS linked`,
              [teamId],
            );
            return row.linked;
          },
          removeMember: async (teamId, userId) => {
            await m.getRepository(UserTeam).delete({ teamId, userId });
          },
          removeTeam: async (id) => {
            await m
              .getRepository(Team)
              .update({ id }, { archivedAt: new Date() });
            await m.getRepository(UserTeam).delete({ teamId: id });
            await m.getRepository(TeamMembershipRequest).delete({ teamId: id });
            await m.query(
              "UPDATE public.league_team_invitation SET status='declined', responded_at=now() WHERE team_id=$1 AND status='pending'",
              [id],
            );
          },
          lockTeam: (id) =>
            m.getRepository(Team).findOne({
              where: { id, archivedAt: IsNull() },
              lock: { mode: 'pessimistic_write' },
            }),
          isCaptain: (actor, teamId) =>
            m
              .getRepository(UserTeam)
              .existsBy({ teamId, userId: actor, role: 'captain' }),
          userExists: (id) => m.getRepository(User).existsBy({ id }),
          isMember: (userId, teamId) =>
            m.getRepository(UserTeam).existsBy({ teamId, userId }),
          pending: (teamId, userId) =>
            m
              .getRepository(TeamMembershipRequest)
              .findOneBy({ teamId, userId, status: 'pending' }),
          request: (id) =>
            m.getRepository(TeamMembershipRequest).findOneBy({ id }),
          createTeam: (input) =>
            m.getRepository(Team).save({
              name: input.name,
              description: input.description ?? null,
              image: input.image ?? null,
            }),
          updateTeam: async (id, input) => {
            await m.getRepository(Team).update(id, {
              name: input.name,
              description: input.description ?? null,
              image: input.image ?? null,
            });
            return m.getRepository(Team).findOneByOrFail({ id });
          },
          addMember: async (teamId, userId, role) => {
            await m.getRepository(UserTeam).insert({
              teamId,
              userId,
              role,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          },
          createRequest: async (input) =>
            (await m.getRepository(TeamMembershipRequest).save(input)).id,
          setRequestStatus: async (id, status) => {
            await m
              .getRepository(TeamMembershipRequest)
              .update(id, { status, updatedAt: new Date() });
          },
          presentRequest: (id) => this.present(m, id),
        }),
      ),
    );
  }
  async requests(actor: string, query: PageRequest, teamId?: string) {
    if (teamId) {
      if (
        !(await this.source
          .getRepository(Team)
          .existsBy({ id: teamId, archivedAt: IsNull() }))
      )
        throw new DomainError('not_found', 'TEAM_NOT_FOUND', 'Team not found');
      await this.captain(this.source.manager, actor, teamId);
    }
    const [rows, total] = await this.source
      .getRepository(TeamMembershipRequest)
      .findAndCount({
        where: teamId
          ? { teamId, status: 'pending' }
          : { userId: actor, status: 'pending' },
        relations: { team: true, user: true },
        order: { id: 'ASC' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    const items = rows.map((row) => ({
      id: row.id,
      teamId: row.teamId,
      teamName: row.team.name,
      userId: row.userId,
      userName: row.user.name,
      createdBy: row.createdBy,
      kind: row.kind,
      status: row.status,
      createdAt: row.createdAt,
    }));
    return paginate(items, total, query);
  }

  async members(teamId: string, query: PageRequest) {
    if (
      !(await this.source
        .getRepository(Team)
        .existsBy({ id: teamId, archivedAt: IsNull() }))
    )
      throw new DomainError('not_found', 'TEAM_NOT_FOUND', 'Team not found');
    const [rows, total] = await this.source
      .getRepository(UserTeam)
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.user', 'user')
      .where('membership.teamId = :teamId', { teamId })
      .select([
        'membership.id',
        'membership.role',
        'membership.createdAt',
        'user.id',
        'user.name',
        'user.username',
        'user.image',
      ])
      .orderBy('membership.role', 'ASC')
      .addOrderBy('user.name', 'ASC', 'NULLS LAST')
      .addOrderBy('user.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    const items: TeamMemberView[] = rows.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      username: membership.user.username,
      image: membership.user.image,
      role: membership.role,
      joinedAt: membership.createdAt,
    }));
    return paginate(items, total, query);
  }
}
