import { describe, expect, it, vi } from 'vitest';
import { profileFormSchema } from './profile.schema';

const validProfile = {
  name: ' Atleta ',
  username: 'ATLETA_1',
  birthDate: '1990-05-12',
  gender: 'O',
};

describe('profileFormSchema', () => {
  it('trims the name and normalizes the username', () => {
    expect(profileFormSchema.parse(validProfile)).toEqual({
      name: 'Atleta',
      username: 'atleta_1',
      birthDate: '1990-05-12',
      gender: 'O',
    });
  });

  it('uses the same UTC eighteenth-birthday boundary as the API', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T00:01:00Z'));
    try {
      expect(
        profileFormSchema.safeParse({
          ...validProfile,
          birthDate: '2008-11-17',
        }).success,
      ).toBe(true);
      expect(
        profileFormSchema.safeParse({
          ...validProfile,
          birthDate: '2008-11-18',
        }).success,
      ).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('accepts undisclosed gender and rejects invalid profile values', () => {
    expect(
      profileFormSchema.parse({ ...validProfile, gender: '' }).gender,
    ).toBe('');
    for (const data of [
      { ...validProfile, name: ' ' },
      { ...validProfile, name: 'x'.repeat(151) },
      { ...validProfile, username: 'ab' },
      { ...validProfile, username: 'x'.repeat(46) },
      { ...validProfile, username: 'nome inválido' },
      { ...validProfile, birthDate: 'bad-date' },
      { ...validProfile, birthDate: '2999-01-01' },
      { ...validProfile, gender: 'X' },
    ])
      expect(profileFormSchema.safeParse(data).success).toBe(false);
  });
});
