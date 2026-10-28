import { AppointmentMembershipsApplication } from './appointment-memberships.application.js';
import type { AppointmentMembershipsRepository } from '../domain/appointment-memberships-repository.port.js';
const profiles = {
  ensureExists: vi.fn().mockResolvedValue(undefined),
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
it('defers time evaluation until the adapter holds the appointment lock', async () => {
  let current = new Date('2026-11-01T00:00:00Z');
  const clock = () => current;
  const repository = { joinAppointment: vi.fn().mockResolvedValue({}) };
  const app = new AppointmentMembershipsApplication(
    repository as unknown as AppointmentMembershipsRepository,
    profiles,
    clock,
  );
  await app.joinAppointment('user', '1', true);
  expect(repository.joinAppointment).toHaveBeenCalledWith(
    'user',
    '1',
    true,
    clock,
  );
  current = new Date('2026-11-02T00:00:00Z');
  expect(repository.joinAppointment.mock.calls[0][3]()).toEqual(current);
});
