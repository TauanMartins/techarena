import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../common/domain/domain-error.js';
import { assertDifferentTeams, assertValidScores } from './league-policy.js';

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
});
