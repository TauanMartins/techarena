import type { UserRepository } from '../domain/user-repository.port.js';
import type { UserProfile } from '../domain/user.js';
import { UserApplication } from './user.application.js';

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
    provision: vi.fn().mockResolvedValue(profile),
    update: vi.fn().mockResolvedValue(profile),
    replaceSports: vi.fn().mockResolvedValue([]),
    setTheme: vi.fn().mockResolvedValue(undefined),
    joinAppointment: vi.fn(),
  };
  return {
    repository,
    application: new UserApplication(
      repository as unknown as UserRepository,
      () => now,
    ),
  };
}
it('never accepts a fabricated age during profile initialization', async () => {
  const { application, repository } = fixture();
  await application.provision({
    id: 'verified',
    email: 'valid@example.test',
    displayName: '  Alice  ',
  });
  expect(repository.provision).toHaveBeenCalledWith({
    id: 'verified',
    email: 'valid@example.test',
    displayName: 'Alice',
  });
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
it('requires an existing profile and a declared adult birth date to participate', async () => {
  const { application, repository } = fixture({ birthDate: null });
  await expect(
    application.joinAppointment('user', '1', true),
  ).rejects.toMatchObject({ code: 'PROFILE_INCOMPLETE' });
  expect(repository.joinAppointment).not.toHaveBeenCalled();
  repository.findById.mockResolvedValue(null);
  await expect(application.theme('user')).rejects.toMatchObject({
    code: 'PROFILE_NOT_FOUND',
  });
});
it.each([
  ['1', '1'],
  ['1', '2', '3', '4', '5'],
])('enforces distinct and at most four favorite sports', async (...ids) => {
  const { application, repository } = fixture();
  await expect(application.replaceSports('user', ids)).rejects.toMatchObject({
    code: 'INVALID_FAVORITE_SPORTS',
  });
  expect(repository.replaceSports).not.toHaveBeenCalled();
});
