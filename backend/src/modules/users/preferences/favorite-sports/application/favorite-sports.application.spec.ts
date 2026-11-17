import type { FavoriteSportsRepository } from './ports/favorite-sports-repository.port.js';
import { FavoriteSportsApplication } from './favorite-sports.application.js';
const profiles = {
  ensureExists: vi.fn().mockResolvedValue(undefined),
  ensureAdmin: vi.fn(),
  ensureAdult: vi.fn(),
};
it.each([['1', '1'], ['1', '2', '3', '4', '5'], ['9223372036854775808']])(
  'rejects duplicate or excessive favorites before persistence',
  async (...ids) => {
    const repository = { transaction: vi.fn() };
    const app = new FavoriteSportsApplication(
      repository as unknown as FavoriteSportsRepository,
      profiles,
    );
    await expect(app.replaceSports('user', ids)).rejects.toMatchObject({
      code: 'INVALID_FAVORITE_SPORTS',
    });
    expect(repository.transaction).not.toHaveBeenCalled();
  },
);
it('checks profile existence through the public port before reading preferences', async () => {
  const repository = { getSports: vi.fn() };
  const missingProfile = {
    ensureExists: vi.fn().mockRejectedValue(new Error('missing')),
    ensureAdmin: vi.fn(),
    ensureAdult: vi.fn(),
  };
  const app = new FavoriteSportsApplication(
    repository as unknown as FavoriteSportsRepository,
    missingProfile,
  );
  await expect(app.sports('user')).rejects.toThrow('missing');
  expect(repository.getSports).not.toHaveBeenCalled();
});

it('keeps existing favorites when any replacement sport is missing', async () => {
  const replace = vi.fn();
  const repository = {
    transaction: async (
      work: (
        store: import('./ports/favorite-sports-repository.port.js').FavoriteSportsStore,
      ) => Promise<unknown>,
    ) =>
      work({
        lockOwner: async () => true,
        countSports: async () => 1,
        replace,
        sports: vi.fn(),
      }),
  };
  const app = new FavoriteSportsApplication(
    repository as unknown as FavoriteSportsRepository,
    profiles,
  );
  await expect(app.replaceSports('user', ['1', '2'])).rejects.toMatchObject({
    code: 'SPORT_NOT_FOUND',
  });
  expect(replace).not.toHaveBeenCalled();
});
