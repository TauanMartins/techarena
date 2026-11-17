import { LeaguesApplication } from './leagues.application.js';
import type { LeagueUseCases } from './ports/leagues.port.js';
it('preserves an omitted description while allowing an explicit clear', async () => {
  const update = vi.fn();
  const app = new LeaguesApplication({ update } as unknown as LeagueUseCases, {
    ensureExists: vi.fn(),
    ensureAdult: vi.fn(),
    ensureAdmin: vi.fn(),
  });
  await app.update('owner', 'league', { name: ' Renamed ' });
  expect(update).toHaveBeenLastCalledWith('owner', 'league', {
    name: 'Renamed',
    description: undefined,
  });
  await app.update('owner', 'league', { description: '' });
  expect(update).toHaveBeenLastCalledWith('owner', 'league', {
    name: undefined,
    description: null,
  });
});
