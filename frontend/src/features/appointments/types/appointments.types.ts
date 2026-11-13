export type {
  Appointment,
  AppointmentMembership,
  AppointmentParticipant,
  Arena,
  FavoriteSports,
  Schedule,
  Sport,
} from '../../../shared/types';

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  sportId?: string;
  arenaId?: string;
  orderByTime?: 'recent' | 'future';
  distance?: 'near' | 'far';
  preferSports?: boolean;
  lat?: number;
  longitude?: number;
}

export interface CreateAppointmentInput {
  arenaId: string;
  sportId: string;
  date: string;
  scheduleId: string;
  title: string;
  description?: string;
  holder: boolean;
  maxPlayers?: number;
}
