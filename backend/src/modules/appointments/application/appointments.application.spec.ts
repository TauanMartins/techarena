import {
  AppointmentsApplication,
  AvailabilityApplication,
} from './appointments.application.js';

import type { BookingContext } from '../domain/booking-policy.js';

const input = {
  arenaId: '1',
  sportId: '2',
  scheduleId: '3',
  date: '2026-11-20',
  holder: false,
};
const context: BookingContext = {
  arena: { id: '1', isLeagueOnly: false, lat: -23, longitude: -46 },
  sport: { id: '2', name: 'Futebol', defaultPlayers: 10 },
  supportsSport: true,
  schedule: { id: '3', horary: '12:00:00' },
};
function fixture() {
  const store = {
    context: vi.fn().mockResolvedValue(context),
    insert: vi.fn().mockResolvedValue({ id: '4' }),
  };
  const repository = {
    list: vi.fn(),
    context: vi.fn().mockResolvedValue(context),
    available: vi.fn().mockResolvedValue([]),
    transaction: <T>(work: (transaction: typeof store) => Promise<T>) =>
      work(store),
  };
  const profiles = {
    ensureAdult: vi.fn().mockResolvedValue(undefined),
    ensureExists: vi.fn(),
    ensureAdmin: vi.fn(),
  };
  const clock = vi.fn(() => new Date('2026-11-20T11:00:00Z'));
  return {
    store,
    repository,
    profiles,
    clock,
    application: new AppointmentsApplication(repository, profiles, clock),
  };
}
it('creates the organizer as a reserve with sport defaults inside the transaction', async () => {
  const f = fixture();
  await f.application.create('organizer', input);
  expect(f.profiles.ensureAdult).toHaveBeenCalledWith('organizer');
  expect(f.store.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      organizerId: 'organizer',
      title: 'Futebol',
      maxPlayers: 10,
      holder: false,
      scheduledAt: new Date('2026-11-20T12:00:00Z'),
    }),
  );
});
it('evaluates time after the persistence adapter has acquired the arena lock', async () => {
  const f = fixture();
  f.store.context.mockImplementation(async () => {
    expect(f.clock).not.toHaveBeenCalled();
    f.clock.mockReturnValue(new Date('2026-11-20T12:00:01Z'));
    return context;
  });
  await expect(f.application.create('organizer', input)).rejects.toMatchObject({
    code: 'PAST_SLOT',
  });
  expect(f.store.insert).not.toHaveBeenCalled();
});
it('does not enter a transaction for an unauthorized participant', async () => {
  const f = fixture();
  f.profiles.ensureAdult.mockRejectedValue(new Error('underage'));
  await expect(f.application.create('organizer', input)).rejects.toThrow(
    'underage',
  );
  expect(f.store.context).not.toHaveBeenCalled();
});
it('rejects a league-only arena before writing any event or membership', async () => {
  const f = fixture();
  f.store.context.mockResolvedValue({
    ...context,
    arena: { ...context.arena, isLeagueOnly: true },
  });
  await expect(f.application.create('organizer', input)).rejects.toMatchObject({
    code: 'LEAGUE_ARENA',
  });
  expect(f.store.insert).not.toHaveBeenCalled();
});
it('propagates transaction failures without returning a successful booking', async () => {
  const f = fixture();
  f.repository.transaction = async () => {
    throw new Error('transaction rolled back');
  };
  await expect(f.application.create('organizer', input)).rejects.toThrow(
    'transaction rolled back',
  );
});
it('validates venue eligibility before querying availability', async () => {
  const f = fixture();
  vi.mocked(f.repository.context).mockResolvedValue({
    ...context,
    supportsSport: false,
  });
  await expect(
    new AvailabilityApplication(f.repository).available(input),
  ).rejects.toMatchObject({ code: 'SPORT_ARENA_NOT_FOUND' });
  expect(f.repository.available).not.toHaveBeenCalled();
});
