import { DataSource } from 'typeorm';

import {
  Appointment,
  UserAppointment,
} from '../../../../../../database/entities/index.js';
import type { AppointmentMembershipsRepository } from '../../domain/appointment-memberships-repository.port.js';
import { UserError } from '../../../../shared/domain/user-error.js';
import { userDatabaseWrite } from '../../../../shared/persistence/database-errors.js';
import { paginate } from '../../../../shared/domain/pagination.js';
import type { PageRequest } from '../../../../shared/domain/pagination.js';

import { assertAppointmentAdmission } from '../../domain/appointment-membership.js';
export class TypeormAppointmentMembershipsRepository implements AppointmentMembershipsRepository {
  constructor(private readonly dataSource: DataSource) {}
  async getAppointments(id: string, request: PageRequest) {
    const [rows, total] = await this.dataSource
      .getRepository(UserAppointment)
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.appointment', 'appointment')
      .where('membership.userId = :id', { id })
      .andWhere('appointment.deletedAt IS NULL')
      .orderBy('appointment.scheduledAt', 'DESC')
      .addOrderBy('appointment.id', 'DESC')
      .skip((request.page - 1) * request.limit)
      .take(request.limit)
      .getManyAndCount();
    return paginate(
      rows.map((row) => ({
        id: row.appointment.id,
        title: row.appointment.title,
        scheduledAt: row.appointment.scheduledAt,
        status: row.appointment.status,
        holder: row.holder,
      })),
      total,
      request,
    );
  }
  async joinAppointment(
    id: string,
    appointmentId: string,
    holder: boolean,
    now: Date,
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
          now,
        );
        await memberships.insert({ userId: id, appointmentId, holder });
        return {
          id: appointment.id,
          title: appointment.title,
          scheduledAt: appointment.scheduledAt,
          status: appointment.status,
          holder,
        };
      }),
    );
  }
}
