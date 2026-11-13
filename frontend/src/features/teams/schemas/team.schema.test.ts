import { describe, expect, it } from 'vitest';
import { teamFormSchema } from './team.schema';

describe('teamFormSchema', () => {
  it('normalizes team name and empty description', () => {
    expect(
      teamFormSchema.parse({ name: ' Equipe A ', description: '  ' }),
    ).toEqual({ name: 'Equipe A', description: undefined });
  });

  it('accepts a description and rejects invalid lengths', () => {
    expect(
      teamFormSchema.parse({ name: 'Equipe A', description: 'Descrição' })
        .description,
    ).toBe('Descrição');
    expect(
      teamFormSchema.safeParse({ name: ' ', description: '' }).success,
    ).toBe(false);
    expect(
      teamFormSchema.safeParse({ name: 'x'.repeat(46), description: '' })
        .success,
    ).toBe(false);
    expect(
      teamFormSchema.safeParse({
        name: 'Equipe A',
        description: 'x'.repeat(2001),
      }).success,
    ).toBe(false);
  });
});
