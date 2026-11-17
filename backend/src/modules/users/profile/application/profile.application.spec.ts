import type { UserProfile } from '../domain/profile.js';
import type { ProfileRepository } from './ports/profile-repository.port.js';
import { ProfileApplication } from './profile.application.js';
const now = new Date('2026-10-28T12:00:00Z');
const profile: UserProfile = {
  id: 'user',
  name: null,
  username: null,
  email: null,
  permission: null,
  birthDate: '2000-01-01',
  gender: null,
  image: null,
  createdAt: now,
};
function fixture(overrides: Partial<UserProfile> = {}) {
  const repository = {
    findById: vi.fn().mockResolvedValue({ ...profile, ...overrides }),
    exists: vi.fn().mockResolvedValue(true),
    findBirthDate: vi.fn().mockResolvedValue({
      birthDate:
        overrides.birthDate !== undefined
          ? overrides.birthDate
          : profile.birthDate,
    }),
    update: vi.fn().mockResolvedValue(profile),
  };
  return {
    repository,
    application: new ProfileApplication(
      repository as unknown as ProfileRepository,
      () => now,
    ),
  };
}
it('reports a missing externally provisioned profile without creating one', async () => {
  const { application, repository } = fixture();
  repository.findById.mockResolvedValue(null);
  await expect(application.profile('user')).rejects.toMatchObject({
    code: 'PROFILE_NOT_FOUND',
  });
  expect(repository.update).not.toHaveBeenCalled();
});
it('rejects an empty profile patch before persistence', async () => {
  const { application, repository } = fixture();
  await expect(
    application.updateProfile('user', { name: undefined }),
  ).rejects.toMatchObject({ code: 'EMPTY_UPDATE' });
  expect(repository.update).not.toHaveBeenCalled();
});
it('rejects underage and invalid calendar dates', async () => {
  const { application, repository } = fixture();
  await expect(
    application.updateProfile('user', { birthDate: '2010-01-01' }),
  ).rejects.toMatchObject({ code: 'MINIMUM_AGE' });
  await expect(
    application.updateProfile('user', { birthDate: '2000-02-30' }),
  ).rejects.toMatchObject({ code: 'INVALID_BIRTH_DATE' });
  expect(repository.update).not.toHaveBeenCalled();
});
it('accepts the eighteenth birthday and rejects the day before it', async () => {
  const { application } = fixture();
  await expect(
    application.updateProfile('user', { birthDate: '2008-10-28' }),
  ).resolves.toBeDefined();
  await expect(
    application.updateProfile('user', { birthDate: '2008-10-29' }),
  ).rejects.toMatchObject({ code: 'MINIMUM_AGE' });
});
it('requires a declared adult birth date before participation', async () => {
  const { application } = fixture({ birthDate: null });
  await expect(application.ensureAdult('user')).rejects.toMatchObject({
    code: 'PROFILE_INCOMPLETE',
  });
});

it('checks existence without loading private profile fields', async () => {
  const { application, repository } = fixture();
  await application.ensureExists('user');
  expect(repository.exists).toHaveBeenCalledWith('user');
  expect(repository.findById).not.toHaveBeenCalled();
  repository.exists.mockResolvedValue(false);
  await expect(application.ensureExists('missing')).rejects.toMatchObject({
    code: 'PROFILE_NOT_FOUND',
  });
});
it('authorizes administration only from the persisted application permission', async () => {
  const normal = fixture();
  await expect(normal.application.ensureAdmin('user')).rejects.toMatchObject({
    kind: 'forbidden',
  });
  const admin = fixture({ permission: 'admin' });
  await expect(admin.application.ensureAdmin('user')).resolves.toBeUndefined();
});
