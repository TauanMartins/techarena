import { planMatchResult, type ResultMatch } from './plan-match-result.js';
const match: ResultMatch = {
  organizerId: 'owner',
  appointmentId: 'match',
  homeTeamId: 'home',
  awayTeamId: 'away',
  resultAllowed: true,
  phase: 'group',
  leagueStatus: 'active',
};
it('records a group draw without inventing a winner', () => {
  expect(
    planMatchResult(match, 'owner', { homeScore: 2, awayScore: 2 }),
  ).toEqual({
    appointmentId: 'match',
    winnerTeamId: null,
    loserTeamId: null,
    winnerScore: 2,
    loserScore: 2,
  });
});
it('keeps scores associated with the winning and losing teams', () => {
  expect(
    planMatchResult(match, 'owner', { homeScore: 1, awayScore: 3 }),
  ).toMatchObject({
    winnerTeamId: 'away',
    loserTeamId: 'home',
    winnerScore: 3,
    loserScore: 1,
  });
});
it.each([
  [
    { ...match, phase: 'knockout' as const },
    'owner',
    'KNOCKOUT_DRAW_NOT_ALLOWED',
  ],
  [match, 'outsider', 'LEAGUE_RESULT_FORBIDDEN'],
  [{ ...match, leagueStatus: 'completed' }, 'owner', 'LEAGUE_ALREADY_FINISHED'],
  [{ ...match, resultAllowed: false }, 'owner', 'LEAGUE_MATCH_NOT_PLAYED'],
])('rejects invalid result transitions', (state, actor, code) => {
  expect(() =>
    planMatchResult(state, actor, { homeScore: 1, awayScore: 1 }),
  ).toThrow(expect.objectContaining({ code }));
});
