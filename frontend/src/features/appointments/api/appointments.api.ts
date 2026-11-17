import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { queryKeys } from '../../../lib/query-client';
import type {
  CreateAppointmentInput,
  AppointmentListParams,
} from '../types/appointments.types';

export const appointmentApi = {
  list: api.listAppointments,
  listMine: api.listMyAppointments,
  personal: api.listPersonalAppointments,
  join: api.joinAppointment,
  create: api.createAppointment,
  availability: api.getAvailability,
  sports: api.getSports,
  arenas: api.listArenas,
  favorites: api.getFavoriteSports,
};

export function useAppointments(
  token: string,
  userId: string,
  params: AppointmentListParams = {},
  mine = false,
) {
  return useQuery({
    queryKey: queryKeys.appointments(userId, { ...params, mine }),
    queryFn: () =>
      mine
        ? appointmentApi.personal(token, params)
        : appointmentApi.list(token, params),
  });
}

export function useJoinAppointment(
  token: string,
  userId: string,
  onJoined?: () => void,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: string | { appointmentId: string; holder: boolean }) =>
      typeof input === 'string'
        ? appointmentApi.join(token, input)
        : appointmentApi.join(token, input.appointmentId, input.holder),
    onSuccess: () => {
      onJoined?.();
      return Promise.all([
        client.invalidateQueries({ queryKey: ['appointments', userId] }),
        client.invalidateQueries({
          queryKey: queryKeys.myAppointments(userId),
        }),
        client.invalidateQueries({
          queryKey: queryKeys.chatConversations(userId),
        }),
      ]);
    },
  });
}

export function useCreateAppointment(token: string, userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) =>
      appointmentApi.create(token, input),
    onSuccess: async () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['appointments', userId] }),
        client.invalidateQueries({
          queryKey: queryKeys.myAppointments(userId),
        }),
        client.invalidateQueries({
          queryKey: queryKeys.chatConversations(userId),
        }),
        client.invalidateQueries({ queryKey: ['availability', userId] }),
      ]),
  });
}

export function useBookingOptions(
  token: string,
  userId: string,
  filters: { sportId?: string; search?: string; page?: number } = {},
) {
  return useQuery({
    queryKey: ['bookingOptions', userId, filters],
    queryFn: async () => {
      const [sports, arenas] = await Promise.all([
        appointmentApi.sports(token),
        appointmentApi.arenas(token, { ...filters, limit: 20 }),
      ]);
      return {
        hasNextPage: arenas.hasNextPage,
        sports: sports.items,
        arenas: arenas.items.filter((arena) => !arena.isLeagueOnly),
      };
    },
  });
}

export function useAppointmentAvailability(
  token: string,
  userId: string,
  arenaId: string,
  sportId: string,
  date: string,
) {
  return useQuery({
    queryKey: queryKeys.availability(userId, arenaId, sportId, date),
    queryFn: () => appointmentApi.availability(token, arenaId, sportId, date),
    enabled: Boolean(arenaId && sportId && date),
  });
}

export function useHomeDashboard(token: string, userId: string) {
  const params = {
    page: 1,
    limit: 6,
    orderByTime: 'recent' as const,
    preferSports: true,
  };
  return useQuery({
    queryKey: queryKeys.appointments(userId, params),
    queryFn: async () => {
      const [appointments, favorites] = await Promise.all([
        appointmentApi.list(token, params),
        appointmentApi.favorites(token),
      ]);
      return { appointments: appointments.items, favorites };
    },
  });
}
