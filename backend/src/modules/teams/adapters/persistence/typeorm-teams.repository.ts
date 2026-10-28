import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import {
  Team,
  TeamMembershipRequest,
  User,
  UserTeam,
} from '../../../../database/entities/index.js';
import { DomainError } from '../../../../common/domain/domain-error.js';
import { paginate } from '../../../../common/domain/pagination.js';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import { escapeLike } from '../../../../common/persistence/queries.js';
import type {
  MembershipDecision,
  MembershipRequestView,
  TeamInput,
  TeamQuery,
  TeamsRepository,
} from '../../domain/teams.port.js';
import { assertMembershipDecision } from '../../domain/team-policy.js';
export class TypeormTeamsRepository implements TeamsRepository {
  constructor(private readonly source: DataSource) {}
  async list(query: TeamQuery) {
    const q = this.source.getRepository(Team).createQueryBuilder('team');
    if (query.search)
      q.where('team.name ILIKE :search', {
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
      .getExists();
  }
  private async team(manager: EntityManager, id: string) {
    const row = await manager
      .getRepository(Team)
      .findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!row)
      throw new DomainError('not_found', 'TEAM_NOT_FOUND', 'Team not found');
    return row;
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
  create(actor: string, input: TeamInput) {
    return databaseWrite(() =>
      this.source.transaction(async (m) => {
        const team = await m.getRepository(Team).save({
          name: input.name,
          description: input.description ?? null,
          image: input.image ?? null,
        });
        await m.getRepository(UserTeam).insert({
          teamId: team.id,
          userId: actor,
          role: 'captain',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return team;
      }),
    );
  }
  update(actor: string, id: string, input: TeamInput) {
    return databaseWrite(() =>
      this.source.transaction(async (m) => {
        await this.team(m, id);
        await this.captain(m, actor, id);
        await m.getRepository(Team).update(id, {
          name: input.name,
          description: input.description ?? null,
          image: input.image ?? null,
        });
        return m.getRepository(Team).findOneByOrFail({ id });
      }),
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
  private async pending(
    m: EntityManager,
    actor: string,
    teamId: string,
    userId: string,
    kind: 'invitation' | 'request',
  ) {
    if (!(await m.getRepository(User).existsBy({ id: userId })))
      throw new DomainError('not_found', 'USER_NOT_FOUND', 'User not found');
    if (await m.getRepository(UserTeam).existsBy({ teamId, userId }))
      throw new DomainError(
        'conflict',
        'ALREADY_MEMBER',
        'User is already a member',
      );
    if (
      await m
        .getRepository(TeamMembershipRequest)
        .existsBy({ teamId, userId, status: 'pending' })
    )
      throw new DomainError(
        'conflict',
        'REQUEST_PENDING',
        'A membership decision is already pending',
      );
    const row = await m
      .getRepository(TeamMembershipRequest)
      .save({ teamId, userId, createdBy: actor, kind, status: 'pending' });
    return this.present(m, row.id);
  }
  invite(actor: string, teamId: string, userId: string) {
    return databaseWrite(() =>
      this.source.transaction(async (m) => {
        await this.team(m, teamId);
        await this.captain(m, actor, teamId);
        return this.pending(m, actor, teamId, userId, 'invitation');
      }),
    );
  }
  requestJoin(actor: string, teamId: string) {
    return databaseWrite(() =>
      this.source.transaction(async (m) => {
        await this.team(m, teamId);
        return this.pending(m, actor, teamId, actor, 'request');
      }),
    );
  }
  private async resolve(
    m: EntityManager,
    row: TeamMembershipRequest,
    decision: MembershipDecision,
  ) {
    if (row.status !== 'pending')
      throw new DomainError(
        'conflict',
        'REQUEST_CLOSED',
        'Membership request was already decided',
      );
    if (decision === 'accept') {
      await m.getRepository(UserTeam).insert({
        teamId: row.teamId,
        userId: row.userId,
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await m.getRepository(TeamMembershipRequest).update(row.id, {
      status: decision === 'accept' ? 'accepted' : 'declined',
      updatedAt: new Date(),
    });
    return this.present(m, row.id);
  }
  decideRequest(
    actor: string,
    teamId: string,
    userId: string,
    decision: MembershipDecision,
  ) {
    return databaseWrite(() =>
      this.source.transaction(async (m) => {
        await this.team(m, teamId);
        await this.captain(m, actor, teamId);
        const row = await m
          .getRepository(TeamMembershipRequest)
          .findOneBy({ teamId, userId, status: 'pending' });
        if (!row)
          throw new DomainError(
            'not_found',
            'REQUEST_NOT_FOUND',
            'Pending membership request not found',
          );
        if (row.kind !== 'request')
          throw new DomainError(
            'conflict',
            'INVITATION_REQUIRES_USER',
            'The invited user must answer this invitation',
          );
        assertMembershipDecision(row.kind, actor, row.userId, true);
        return this.resolve(m, row, decision);
      }),
    );
  }
  respondInvitation(actor: string, id: string, decision: MembershipDecision) {
    return databaseWrite(() =>
      this.source.transaction(async (m) => {
        const initial = await m
          .getRepository(TeamMembershipRequest)
          .findOneBy({ id });
        if (!initial)
          throw new DomainError(
            'not_found',
            'REQUEST_NOT_FOUND',
            'Membership request not found',
          );
        await this.team(m, initial.teamId);
        const row = await m
          .getRepository(TeamMembershipRequest)
          .findOneByOrFail({ id });
        assertMembershipDecision(row.kind, actor, row.userId, false);
        await this.captain(m, row.createdBy, row.teamId);
        return this.resolve(m, row, decision);
      }),
    );
  }
  async requests(actor: string, query: PageRequest, teamId?: string) {
    if (teamId) {
      if (!(await this.source.getRepository(Team).existsBy({ id: teamId })))
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
}
