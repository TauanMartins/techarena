import type { DataSource } from 'typeorm';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import type {
  LeagueSession,
  LeagueStore,
} from '../../application/ports/league-store.port.js';
import { createLeagueSession } from './create-league-session.js';
export class TypeormLeagueStore implements LeagueStore {
  readonly queries: LeagueSession;
  constructor(private readonly source: DataSource) {
    this.queries = createLeagueSession(source);
  }
  transaction<T>(work: (session: LeagueSession) => Promise<T>): Promise<T> {
    return databaseWrite(() =>
      this.source.transaction((manager) => work(createLeagueSession(manager))),
    );
  }
}
