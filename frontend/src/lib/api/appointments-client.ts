import type {
  Appointment,
  AppointmentMembership,
  Page,
  Schedule,
} from '../../shared/types';
import { apiRequest } from './api-request';
import { queryString } from './query-string';
export const appointmentsClient = {
  listAppointments: (
    token: string,
    params: {
      page?: number;
      limit?: number;
      sportId?: string;
      arenaId?: string;
      orderByTime?: 'recent' | 'future';
      distance?: 'near' | 'far';
      preferSports?: boolean;
      lat?: number;
      longitude?: number;
    } = {},
  ) =>
    apiRequest<Page<Appointment>>(
      `/appointments${queryString({ page: 1, limit: 20, orderByTime: 'future', ...params })}`,
      token,
    ),
  listMyAppointments: (token: string, page = 1) =>
    apiRequest<Page<AppointmentMembership>>(
      `/users/me/appointments${queryString({ page, limit: 20, from: new Date().toISOString(), sortOrder: 'asc' })}`,
      token,
    ),
  joinAppointment: (token: string, appointmentId: string, holder = true) =>
    apiRequest<AppointmentMembership>(
      `/users/me/appointments/${appointmentId}`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ holder }),
      },
    ),
  getAvailability: (
    token: string,
    arenaId: string,
    sportId: string,
    date: string,
  ) =>
    apiRequest<{ items: Schedule[] }>(
      `/horary${queryString({ arenaId, sportId, date })}`,
      token,
    ),
  createAppointment: (
    token: string,
    payload: {
      arenaId: string;
      sportId: string;
      date: string;
      scheduleId: string;
      title: string;
      description?: string;
      holder: boolean;
      maxPlayers?: number;
    },
  ) =>
    apiRequest<Appointment>('/appointments', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
