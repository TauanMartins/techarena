import { assertAppointmentAdmission } from './user.js';
const now = new Date('2026-10-28T12:00:00Z');
const appointment = {
  deleted: false,
  status: 'scheduled',
  scheduledAt: new Date('2026-10-29T12:00:00Z'),
  alreadyParticipating: false,
  startingPlayers: 0,
  maxPlayers: 1,
};
it.each([
  [{ deleted: true }, 'APPOINTMENT_NOT_FOUND'],
  [{ status: 'finished' }, 'APPOINTMENT_CLOSED'],
  [{ status: 'canceled' }, 'APPOINTMENT_CLOSED'],
  [{ scheduledAt: now }, 'APPOINTMENT_CLOSED'],
  [{ alreadyParticipating: true }, 'ALREADY_PARTICIPATING'],
  [{ startingPlayers: 1 }, 'APPOINTMENT_FULL'],
])('rejects ineligible appointment participation', (overrides, code) => {
  expect(() =>
    assertAppointmentAdmission({ ...appointment, ...overrides }, true, now),
  ).toThrow(expect.objectContaining({ code }));
});
it('allows reserves independently of the starting-player limit', () => {
  expect(() =>
    assertAppointmentAdmission(
      { ...appointment, startingPlayers: 1 },
      false,
      now,
    ),
  ).not.toThrow();
});
