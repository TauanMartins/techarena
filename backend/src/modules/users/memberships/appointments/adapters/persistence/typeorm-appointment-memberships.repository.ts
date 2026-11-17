import { DataSource } from 'typeorm';
import type { AppointmentAdmissionStore } from '../../application/ports/appointment-memberships-repository.port.js';

import {
  Appointment,
  UserAppointment,
} from '../../../../../../database/entities/index.js';
import { paginate } from '../../../../shared/domain/pagination.js';
import { userDatabaseWrite } from '../../../../shared/persistence/database-errors.js';
import type { AppointmentMembershipsRepository } from '../../application/ports/appointment-memberships-repository.port.js';
import type { AppointmentMembershipQuery } from '../../domain/appointment-membership.js';

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
  transaction<T>(
    work: (store: AppointmentAdmissionStore) => Promise<T>,
  ): Promise<T> {
    return userDatabaseWrite(() =>
      this.dataSource.transaction((manager) =>
        work({
          lock: async (userId, appointmentId, holder) => {
            const appointment = await manager
              .getRepository(Appointment)
              .findOne({
                where: { id: appointmentId },
                lock: { mode: 'pessimistic_write' },
              });
            if (!appointment) return null;
            const memberships = manager.getRepository(UserAppointment);
            return {
              summary: summary(appointment, userId, holder),
              admission: {
                deleted: appointment.deletedAt !== null,
                status: appointment.status,
                scheduledAt: appointment.scheduledAt,
                maxPlayers: appointment.maxPlayers,
                alreadyParticipating: await memberships.existsBy({
                  appointmentId,
                  userId,
                }),
                startingPlayers: await memberships.countBy({
                  appointmentId,
                  holder: true,
                }),
              },
            };
          },
          insert: async (userId, appointmentId, holder) => {
            await manager
              .getRepository(UserAppointment)
              .insert({ userId, appointmentId, holder });
          },
        }),
      ),
    );
  }
}
