import type { AppointmentMembershipsRepository } from './ports/appointment-memberships-repository.port.js';
import { AppointmentMembershipsApplication } from './appointment-memberships.application.js';
const profiles = {
  ensureExists: vi.fn().mockResolvedValue(undefined),
  ensureAdmin: vi.fn(),
  ensureAdult: vi.fn().mockResolvedValue(undefined),
};
it('rejects reversed date ranges before hitting the membership repository', async () => {
  const repository = { getAppointments: vi.fn() };
  const app = new AppointmentMembershipsApplication(
    repository as unknown as AppointmentMembershipsRepository,
    profiles,
  );
  await expect(
    app.appointments('user', {
      page: 1,
      limit: 20,
      sortOrder: 'desc',
      from: '2026-11-02T00:00:00Z',
      to: '2026-11-01T00:00:00Z',
    }),
  ).rejects.toMatchObject({ code: 'INVALID_DATE_RANGE' });
  expect(repository.getAppointments).not.toHaveBeenCalled();
});
it('evaluates admission time after acquiring the lock', async () => {
  let current = new Date('2026-11-01T11:59:00Z');
  const insert = vi.fn();
  const repository = {
    transaction: async (
      work: (
        store: import('./ports/appointment-memberships-repository.port.js').AppointmentAdmissionStore,
      ) => Promise<unknown>,
    ) =>
      work({
        lock: async () => {
          current = new Date('2026-11-01T12:01:00Z');
          return {
            admission: {
              deleted: false,
              status: 'scheduled',
              scheduledAt: new Date('2026-11-01T12:00:00Z'),
              alreadyParticipating: false,
              maxPlayers: 4,
              startingPlayers: 0,
            },
            summary:
              {} as import('../domain/appointment-membership.js').AppointmentSummary,
          };
        },
        insert,
      }),
  };
  const app = new AppointmentMembershipsApplication(
    repository as unknown as AppointmentMembershipsRepository,
    profiles,
    () => current,
  );
  await expect(app.joinAppointment('user', '1', true)).rejects.toMatchObject({
    code: 'APPOINTMENT_CLOSED',
  });
  expect(insert).not.toHaveBeenCalled();
});
