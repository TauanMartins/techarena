import { DataSource } from 'typeorm';

import { UserTeam } from '../../../../../../database/entities/index.js';
import type { TeamMembershipsRepository } from '../../domain/team-memberships-repository.port.js';

import { paginate } from '../../../../shared/domain/pagination.js';
import type { PageRequest } from '../../../../shared/domain/pagination.js';

export class TypeormTeamMembershipsRepository implements TeamMembershipsRepository {
  constructor(private readonly dataSource: DataSource) {}
  async getTeams(id: string, request: PageRequest) {
    const [rows, total] = await this.dataSource
      .getRepository(UserTeam)
      .findAndCount({
        where: { userId: id },
        relations: { team: true },
        order: { id: 'ASC' },
        skip: (request.page - 1) * request.limit,
        take: request.limit,
      });
    return paginate(
      rows.map((row) => ({
        id: row.team.id,
        name: row.team.name,
        role: row.role,
      })),
      total,
      request,
    );
  }
}
