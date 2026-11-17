import { Fixture } from './league-policy-types.js';
export function roundRobinFixtures(
  teamIds: string[],
  phase: 'group' | 'knockout',
  groupNumber: number | null = null,
): Fixture[] {
  const teams: (string | null)[] = [...teamIds];
  if (teams.length % 2) teams.push(null);
  const fixtures: Fixture[] = [];
  for (let roundNumber = 1; roundNumber < teams.length; roundNumber += 1) {
    for (let index = 0; index < teams.length / 2; index += 1) {
      const homeTeamId = teams[index];
      const awayTeamId = teams[teams.length - 1 - index];
      if (homeTeamId && awayTeamId) {
        fixtures.push({
          homeTeamId,
          awayTeamId,
          phase,
          roundNumber,
          groupNumber,
        });
      }
    }
    const fixed = teams[0];
    const rotated = teams.slice(1);
    rotated.unshift(rotated.pop()!);
    teams.splice(0, teams.length, fixed, ...rotated);
  }
  return fixtures;
}
