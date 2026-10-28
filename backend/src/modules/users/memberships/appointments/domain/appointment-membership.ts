import { UserError } from '../../../shared/domain/user-error.js';
export interface AppointmentSummary {
  id: string;
  title: string;
  scheduledAt: Date;
  status: string;
  holder: boolean;
}
export interface AppointmentAdmission {
  deleted: boolean;
  status: string;
  scheduledAt: Date;
  alreadyParticipating: boolean;
  maxPlayers: number | null;
  startingPlayers: number;
}

export function assertAppointmentAdmission(
  appointment: AppointmentAdmission,
  holder: boolean,
  now: Date,
): void {
  if (appointment.deleted)
    throw new UserError(
      'not_found',
      'APPOINTMENT_NOT_FOUND',
      'Appointment not found',
    );
  if (appointment.status !== 'scheduled' || appointment.scheduledAt <= now)
    throw new UserError(
      'conflict',
      'APPOINTMENT_CLOSED',
      'This appointment no longer accepts participants',
    );
  if (appointment.alreadyParticipating)
    throw new UserError(
      'conflict',
      'ALREADY_PARTICIPATING',
      'You are already participating',
    );
  if (
    holder &&
    appointment.maxPlayers !== null &&
    appointment.startingPlayers >= appointment.maxPlayers
  ) {
    throw new UserError(
      'conflict',
      'APPOINTMENT_FULL',
      'All starting-player places are filled',
    );
  }
}
