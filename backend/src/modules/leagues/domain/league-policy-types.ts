export interface Fixture {
  homeTeamId: string;
  awayTeamId: string;
  phase: 'group' | 'knockout';
  roundNumber: number;
  groupNumber: number | null;
}
