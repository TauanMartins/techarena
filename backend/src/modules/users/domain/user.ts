export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  permission: string | null;
  username: string | null;
  birthDate: string | null;
  gender: string | null;
  image: string | null;
  createdAt: Date;
}
export type ProfileChanges = Partial<
  Pick<UserProfile, 'name' | 'username' | 'birthDate' | 'gender' | 'image'>
>;
export type UserCard = Pick<UserProfile, 'id' | 'name' | 'username' | 'image'>;
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface PageRequest {
  page: number;
  limit: number;
}
export interface SportSummary {
  id: string;
  name: string;
}
export interface TeamSummary {
  id: string;
  name: string;
  role: string;
}
export interface AppointmentSummary {
  id: string;
  title: string;
  scheduledAt: Date;
  status: string;
  holder: boolean;
}
export interface ProfileIdentity {
  id: string;
  email: string | null;
  displayName: string | null;
}
export type Theme = 'light' | 'dark' | 'system';

export class UserError extends Error {
  constructor(
    readonly kind: 'invalid' | 'not_found' | 'conflict',
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** A birth date must be real and represent an adult; no fabricated default age. */
export function validateBirthDate(value: string, now: Date): void {
  const date = new Date(value + 'T00:00:00.000Z');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new UserError(
      'invalid',
      'INVALID_BIRTH_DATE',
      'Birth date must be a valid calendar date',
    );
  }
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  if (
    now.getUTCMonth() < date.getUTCMonth() ||
    (now.getUTCMonth() === date.getUTCMonth() &&
      now.getUTCDate() < date.getUTCDate())
  )
    age--;
  if (age < 18)
    throw new UserError(
      'invalid',
      'MINIMUM_AGE',
      'Users must be at least 18 years old',
    );
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
