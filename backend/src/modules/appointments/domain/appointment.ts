import type { GeoFilter } from '../../../common/domain/geo.js';
import type { PageRequest } from '../../../common/domain/pagination.js';
export interface AppointmentQuery extends PageRequest, GeoFilter {
  period?: 'upcoming' | 'past';
  sportId?: string;
  arenaId?: string;
  preferSports: boolean;
  orderByTime: 'recent' | 'future';
  distance: 'near' | 'far';
}
export interface CreateAppointment {
  arenaId: string;
  sportId: string;
  scheduleId: string;
  date: string;
  title?: string;
  description?: string;
  holder: boolean;
  maxPlayers?: number;
}
export interface AppointmentParticipant {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  holder: boolean;
}
export interface BookingCard {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  status: string;
  organizerId: string;
  arenaId: string | null;
  sportId: string | null;
  scheduleId: string | null;
  arenaAddress: string | null;
  arenaImage: string | null;
  sportName: string | null;
  maxPlayers: number | null;
  players: number;
  startingPlayers: number;
  isInside: boolean;
  distanceKm: number | null;
  participants: AppointmentParticipant[];
}
export interface AvailabilityQuery {
  arenaId: string;
  sportId: string;
  date: string;
}
export interface ScheduleItem {
  id: string;
  horary: string;
}
