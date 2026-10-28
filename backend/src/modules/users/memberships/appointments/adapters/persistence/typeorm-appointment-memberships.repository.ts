import { DataSource } from 'typeorm';

import {
  Appointment,
  UserAppointment,
} from '../../../../../../database/entities/index.js';
import type { AppointmentMembershipsRepository } from '../../domain/appointment-memberships-repository.port.js';
import { UserError } from '../../../../shared/domain/user-error.js';
import { userDatabaseWrite } from '../../../../shared/persistence/database-errors.js';
import { paginate } from '../../../../shared/domain/pagination.js';
import type { AppointmentMembershipQuery } from '../../domain/appointment-membership.js';

import { assertAppointmentAdmission } from '../../domain/appointment-membership.js';
function summary(appointment: Appointment, userId: string, holder: boolean) {
  return {
    id: appointment.id,
    title: appointment.title,
    description: appointment.description,
    scheduledAt: appointment.scheduledAt,
    status: appointment.status,
    holder,
    organizerId: appointment.organizerId,
    isOrganizer: appointment.organizerId === userId,
    maxPlayers: appointment.maxPlayers,
  };
}
export class TypeormAppointmentMembershipsRepository implements AppointmentMembershipsRepository {
  constructor(private readonly dataSource: DataSource) {}
  async getAppointments(id: string, query: AppointmentMembershipQuery) {
    const builder = this.dataSource
      .getRepository(UserAppointment)
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.appointment', 'appointment')
      .where('membership.userId = :id', { id })
      .andWhere('appointment.deletedAt IS NULL');
    if (query.status)
      builder.andWhere('appointment.status = :status', {
        status: query.status,
      });
    if (query.holder !== undefined)
      builder.andWhere('membership.holder = :holder', { holder: query.holder });
    if (query.from)
      builder.andWhere('appointment.scheduledAt >= :from', {
        from: new Date(query.from),
      });
    if (query.to)
      builder.andWhere('appointment.scheduledAt <= :to', {
        to: new Date(query.to),
      });
    const order = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const [rows, total] = await builder
      .orderBy('appointment.scheduledAt', order)
      .addOrderBy('appointment.id', order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(
      rows.map((row) => summary(row.appointment, id, row.holder)),
      total,
      query,
    );
  }
  async joinAppointment(
    id: string,
    appointmentId: string,
    holder: boolean,
    clock: () => Date,
  ) {
    return userDatabaseWrite(() =>
      this.dataSource.transaction(async (manager) => {
        const appointment = await manager.getRepository(Appointment).findOne({
          where: { id: appointmentId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!appointment)
          throw new UserError(
            'not_found',
            'APPOINTMENT_NOT_FOUND',
            'Appointment not found',
          );
        const memberships = manager.getRepository(UserAppointment);
        assertAppointmentAdmission(
          {
            deleted: appointment.deletedAt !== null,
            status: appointment.status,
            scheduledAt: appointment.scheduledAt,
            maxPlayers: appointment.maxPlayers,
            alreadyParticipating: await memberships.existsBy({
              appointmentId,
              userId: id,
            }),
            startingPlayers: await memberships.countBy({
              appointmentId,
              holder: true,
            }),
          },
          holder,
          clock(),
        );
        await memberships.insert({ userId: id, appointmentId, holder });
        return summary(appointment, id, holder);
      }),
    );
  }
}
