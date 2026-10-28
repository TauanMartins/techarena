import type { DataSource } from 'typeorm';
import { Appointment } from '../../../../../../database/entities/index.js';
import { TypeormAppointmentMembershipsRepository } from './typeorm-appointment-memberships.repository.js';

it('rejects an appointment that starts while admission is waiting for its row lock', async () => {
  let release!: (value: Appointment) => void;
  const pendingLock = new Promise<Appointment>((resolve) => {
    release = resolve;
  });
  const appointment = Object.assign(new Appointment(), {
    id: '1',
    organizerId: 'organizer',
    title: 'Match',
    description: null,
    scheduledAt: new Date('2026-11-01T12:00:00Z'),
    status: 'scheduled',
    deletedAt: null,
    maxPlayers: 4,
  });
  const appointments = { findOne: vi.fn().mockReturnValue(pendingLock) };
  const memberships = {
    existsBy: vi.fn().mockResolvedValue(false),
    countBy: vi.fn().mockResolvedValue(0),
    insert: vi.fn(),
  };
  const manager = {
    getRepository: (entity: unknown) =>
      entity === Appointment ? appointments : memberships,
  };
  const source = {
    transaction: (operation: (value: typeof manager) => Promise<unknown>) =>
      operation(manager),
  } as unknown as DataSource;
  const repository = new TypeormAppointmentMembershipsRepository(source);
  const clock = vi.fn(() => new Date('2026-11-01T12:00:01Z'));
  const request = repository.joinAppointment('user', '1', true, clock);
  expect(clock).not.toHaveBeenCalled();
  release(appointment);
  await expect(request).rejects.toMatchObject({ code: 'APPOINTMENT_CLOSED' });
  expect(clock).toHaveBeenCalledOnce();
  expect(memberships.insert).not.toHaveBeenCalled();
});
