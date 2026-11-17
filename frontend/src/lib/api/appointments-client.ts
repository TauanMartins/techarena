import type { AppointmentListParams } from '../../features/appointments/types/appointments.types';
import type {
  Appointment,
  AppointmentMembership,
  Page,
  Schedule,
} from '../../shared/types';
import { apiRequest } from './api-request';
import { queryString } from './query-string';
export const appointmentsClient = {
  listAppointments: (token: string, params: AppointmentListParams = {}) =>
    apiRequest<Page<Appointment>>(
      `/appointments${queryString({ page: 1, limit: 20, orderByTime: 'recent', ...params })}`,
      token,
    ),
  listPersonalAppointments: (
    token: string,
    params: AppointmentListParams = {},
  ) =>
    apiRequest<Page<Appointment>>(
      `/appointments/user${queryString({ page: 1, limit: 20, ...params })}`,
      token,
    ),
  listMyAppointments: (token: string, page = 1) =>
    apiRequest<Page<AppointmentMembership>>(
      `/users/me/appointments${queryString({ page, limit: 20, sortOrder: 'desc' })}`,
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
