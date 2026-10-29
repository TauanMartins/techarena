import { describe, expect, it } from 'vitest';
import {
  bookingFormSchema,
  leagueCreateFormSchema,
  leagueScoreSchema,
  profileFormSchema,
  teamFormSchema,
} from './validation';

describe('form validation schemas', () => {
  it('normalizes profile identity fields and accepts supported gender values', () => {
    expect(
      profileFormSchema.parse({
        name: '  Atleta  ',
        username: '  Atleta_1 ',
        birthDate: '1990-05-12',
        gender: 'O',
      }),
    ).toEqual({
      name: 'Atleta',
      username: 'atleta_1',
      birthDate: '1990-05-12',
      gender: 'O',
    });
  });

  it('rejects invalid usernames and future birth dates', () => {
    expect(
      profileFormSchema.safeParse({
        name: 'Atleta',
        username: 'nome inválido',
        birthDate: '1990-05-12',
        gender: '',
      }).success,
    ).toBe(false);
    expect(
      profileFormSchema.safeParse({
        name: 'Atleta',
        username: 'atleta',
        birthDate: '2999-01-01',
        gender: '',
      }).success,
    ).toBe(false);
  });

  it('normalizes empty team descriptions and enforces name limits', () => {
    expect(teamFormSchema.parse({ name: '  Vôlei  ', description: '  ' })).toEqual({
      name: 'Vôlei',
      description: undefined,
    });
    expect(
      teamFormSchema.safeParse({ name: ' ', description: '' }).success,
    ).toBe(false);
    expect(
      teamFormSchema.safeParse({
        name: 'Equipe',
        description: 'x'.repeat(2001),
      }).success,
    ).toBe(false);
  });

  it('validates booking fields and converts the optional player limit', () => {
    expect(
      bookingFormSchema.parse({
        sportId: 'sport',
        arenaId: 'arena',
        scheduleId: 'schedule',
        date: '2999-01-01',
        title: '  Partida  ',
        description: '',
        maxPlayers: '12',
      }),
    ).toEqual({
      sportId: 'sport',
      arenaId: 'arena',
      scheduleId: 'schedule',
      date: '2999-01-01',
      title: 'Partida',
      description: '',
      maxPlayers: 12,
    });

    expect(
      bookingFormSchema.safeParse({
        sportId: 'sport',
        arenaId: '',
        scheduleId: '',
        date: '2999-01-01',
        title: '',
        description: '',
        maxPlayers: '1.5',
      }).success,
    ).toBe(false);

    expect(
      bookingFormSchema.parse({
        sportId: 'sport',
        arenaId: 'arena',
        scheduleId: 'schedule',
        date: '2999-01-01',
        title: '',
        description: '',
        maxPlayers: '',
      }).maxPlayers,
    ).toBeUndefined();
  });

  it('coerces and validates league configuration and match scores', () => {
    expect(
      leagueCreateFormSchema.parse({
        name: '  Liga  ',
        description: '',
        sportId: 'sport',
        tournamentFormat: 'groups_knockout',
        groupCount: '4',
        qualifiersPerGroup: '2',
      }),
    ).toEqual({
      name: 'Liga',
      description: undefined,
      sportId: 'sport',
      tournamentFormat: 'groups_knockout',
      groupCount: 4,
      qualifiersPerGroup: 2,
    });

    expect(
      leagueCreateFormSchema.safeParse({
        name: 'Liga',
        description: '',
        sportId: 'sport',
        tournamentFormat: 'groups_knockout',
        groupCount: '1',
        qualifiersPerGroup: '2',
      }).success,
    ).toBe(false);
    expect(
      leagueScoreSchema.parse({ homeScore: '3', awayScore: '0' }),
    ).toEqual({ homeScore: 3, awayScore: 0 });
    expect(
      leagueScoreSchema.safeParse({ homeScore: '-1', awayScore: '1.5' })
        .success,
    ).toBe(false);
  });
});
