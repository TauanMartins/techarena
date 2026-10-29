import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../common/domain/domain-error.js';
import {
  assertDifferentTeams,
  assertValidScores,
  buildInitialFixtures,
  buildKnockoutFixtures,
} from './league-policy.js';

describe('league match policy', () => {
  it('rejects a team playing against itself', () => {
    expect(() => assertDifferentTeams('12', '12')).toThrow(DomainError);
  });

  it('allows different teams', () => {
    expect(() => assertDifferentTeams('12', '13')).not.toThrow();
  });

  it('allows draws and validates non-negative integer scores', () => {
    expect(() => assertValidScores(2, 2)).not.toThrow();
    expect(() => assertValidScores(3, 2)).not.toThrow();
    expect(() => assertValidScores(-1, 2)).toThrow(DomainError);
    expect(() => assertValidScores(2.5, 2)).toThrow(DomainError);
  });

  it('creates every round-robin pairing once and assigns group fixtures', () => {
    const fixtures = buildInitialFixtures(
      ['1', '2', '3', '4'],
      'round_robin',
      2,
      2,
    );
    expect(fixtures).toHaveLength(6);
    expect(
      new Set(
        fixtures.map((fixture) =>
          [fixture.homeTeamId, fixture.awayTeamId].sort().join(':'),
        ),
      ).size,
    ).toBe(6);

    const groups = buildInitialFixtures(
      ['1', '2', '3', '4'],
      'groups_knockout',
      2,
      1,
    );
    expect(groups).toHaveLength(2);
    expect(groups.every((fixture) => fixture.phase === 'group')).toBe(true);
    expect(groups.map((fixture) => fixture.groupNumber)).toEqual([1, 2]);
  });

  it('rejects invalid bracket sizes and pairs knockout teams', () => {
    expect(() =>
      buildInitialFixtures(['1', '2', '3'], 'knockout', 2, 2),
    ).toThrow(DomainError);
    expect(buildKnockoutFixtures(['1', '2', '3', '4'], 2)).toHaveLength(2);
  });
});
