import { FavoriteSportsApplication } from './favorite-sports.application.js';
import type { FavoriteSportsRepository } from '../domain/favorite-sports-repository.port.js';
const profiles = {
  ensureExists: vi.fn().mockResolvedValue(undefined),
  ensureAdmin: vi.fn(),
  ensureAdult: vi.fn(),
};
it.each([['1', '1'], ['1', '2', '3', '4', '5'], ['9223372036854775808']])(
  'rejects duplicate or excessive favorites before persistence',
  async (...ids) => {
    const repository = { replaceSports: vi.fn() };
    const app = new FavoriteSportsApplication(
      repository as unknown as FavoriteSportsRepository,
      profiles,
    );
    await expect(app.replaceSports('user', ids)).rejects.toMatchObject({
      code: 'INVALID_FAVORITE_SPORTS',
    });
    expect(repository.replaceSports).not.toHaveBeenCalled();
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
