import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../shared/api";
import { queryKeys } from "../../../shared/queryClient";
import type { CreateAppointmentInput, AppointmentListParams } from "../types/appointments.types";

export const appointmentApi = {
  list: api.listAppointments,
  listMine: api.listMyAppointments,
  join: api.joinAppointment,
  create: api.createAppointment,
  availability: api.getAvailability,
  sports: api.getSports,
  arenas: api.listArenas,
};

export function useAppointments(token: string, userId: string, params: AppointmentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.appointments(userId, params),
    queryFn: () => appointmentApi.list(token, params),
  });
}

export function useJoinAppointment(token: string, userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentApi.join(token, appointmentId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["appointments", userId] }),
  });
}

export function useCreateAppointment(token: string, userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => appointmentApi.create(token, input),
    onSuccess: async () => Promise.all([
      client.invalidateQueries({ queryKey: ["appointments", userId] }),
      client.invalidateQueries({ queryKey: queryKeys.myAppointments(userId) }),
    ]),
  });
}
