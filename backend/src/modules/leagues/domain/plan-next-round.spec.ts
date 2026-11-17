import { planNextRound, type RoundMatch } from './plan-next-round.js';
const league = {
  format: 'groups_knockout',
  groupCount: 2,
  qualifiersPerGroup: 1,
};
it('qualifies teams after completed group draws using the ordered standings', () => {
  const matches: RoundMatch[] = [
    { id: '1', phase: 'group', roundNumber: 1, winnerTeamId: null },
  ];
  expect(
    planNextRound(
      league,
      matches,
      [
        { teamId: 'a', groupNumber: 1 },
        { teamId: 'b', groupNumber: 2 },
      ],
      0,
      0,
    ),
  ).toEqual([
    {
      homeTeamId: 'a',
      awayTeamId: 'b',
      phase: 'knockout',
      roundNumber: 1,
      groupNumber: null,
    },
  ]);
  expect(() => planNextRound(league, matches, [], 0, 1)).toThrow(
    expect.objectContaining({ code: 'LEAGUE_GROUPS_INCOMPLETE' }),
  );
});
it('does not generate another round after the final', () => {
  expect(() =>
    planNextRound(
      { ...league, format: 'knockout' },
      [{ id: 'final', phase: 'knockout', roundNumber: 2, winnerTeamId: 'a' }],
      [],
      0,
      0,
    ),
  ).toThrow(expect.objectContaining({ code: 'LEAGUE_TOURNAMENT_FINISHED' }));
});
it('requires every knockout winner before advancing', () => {
  expect(() =>
    planNextRound(
      { ...league, format: 'knockout' },
      [{ id: 'semi', phase: 'knockout', roundNumber: 1, winnerTeamId: null }],
      [],
      1,
      0,
    ),
  ).toThrow(expect.objectContaining({ code: 'LEAGUE_ROUND_INCOMPLETE' }));
});
