import { describe, expect, it } from 'vitest';
import {
  leagueCreateFormSchema,
  leagueScoreSchema,
  leagueUpdateFormSchema,
} from './league.schema';

const league = {
  name: ' Liga 2026 ',
  description: ' Temporada ',
  tournamentFormat: 'round_robin',
  groupCount: '4',
  qualifiersPerGroup: '2',
};

describe('league schemas', () => {
  it('normalizes create and update payloads', () => {
    expect(
      leagueCreateFormSchema.parse({ ...league, sportId: 'sport-1' }),
    ).toEqual({
      name: 'Liga 2026',
      description: 'Temporada',
      tournamentFormat: 'round_robin',
      groupCount: 4,
      qualifiersPerGroup: 2,
      sportId: 'sport-1',
    });
    expect(
      leagueUpdateFormSchema.parse({ ...league, description: '  ' }),
    ).toMatchObject({
      name: 'Liga 2026',
      description: undefined,
      groupCount: 4,
      qualifiersPerGroup: 2,
    });
  });

  it('rejects invalid names, formats, groups, qualifiers, and missing sport', () => {
    for (const data of [
      { ...league, name: '   ' },
      { ...league, name: 'x'.repeat(46) },
      { ...league, description: 'x'.repeat(501) },
      { ...league, tournamentFormat: 'invalid' },
      { ...league, groupCount: '1' },
      { ...league, groupCount: '17' },
      { ...league, groupCount: '2.5' },
      { ...league, qualifiersPerGroup: '0' },
      { ...league, qualifiersPerGroup: '9' },
      { ...league, qualifiersPerGroup: '1.5' },
    ])
      expect(leagueUpdateFormSchema.safeParse(data).success).toBe(false);
    expect(
      leagueCreateFormSchema.safeParse({ ...league, sportId: '' }).success,
    ).toBe(false);
  });

  it('converts non-negative integer score strings and rejects malformed scores', () => {
    expect(leagueScoreSchema.parse({ homeScore: '3', awayScore: '0' })).toEqual(
      { homeScore: 3, awayScore: 0 },
    );
    for (const score of ['-1', '1.5', ''])
      expect(
        leagueScoreSchema.safeParse({ homeScore: score, awayScore: '0' })
          .success,
      ).toBe(false);
  });
});
