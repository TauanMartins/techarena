import { DataSource } from 'typeorm';
import { UserTeam } from '../../../../../../database/entities/index.js';
import type { TeamMembershipsRepository } from '../../domain/team-memberships-repository.port.js';
import type { TeamMembershipQuery } from '../../domain/team-membership.js';
import { paginate } from '../../../../shared/domain/pagination.js';
export class TypeormTeamMembershipsRepository implements TeamMembershipsRepository {
  constructor(private readonly dataSource: DataSource) {}
  async getTeams(id: string, query: TeamMembershipQuery) {
    const builder = this.dataSource
      .getRepository(UserTeam)
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.team', 'team')
      .where('membership.userId = :id', { id });
    if (query.search)
      builder.andWhere('team.name ILIKE :search', {
        search: `%${query.search.replace(/[\\%_]/g, '\\$&')}%`,
      });
    if (query.role)
      builder.andWhere('membership.role = :role', { role: query.role });
    const columns = { joinedAt: 'membership.createdAt', name: 'team.name' };
    const order = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const [rows, total] = await builder
      .orderBy(columns[query.sortBy], order, 'NULLS LAST')
      .addOrderBy('membership.id', order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(
      rows.map((row) => ({
        id: row.team.id,
        name: row.team.name,
        role: row.role,
        description: row.team.description,
        image: row.team.image,
        joinedAt: row.createdAt,
      })),
      total,
      query,
    );
  }
}
