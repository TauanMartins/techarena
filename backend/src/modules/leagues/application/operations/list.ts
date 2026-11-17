import type { LeagueStore } from '../ports/league-store.port.js';
import { summary } from './summary.js';
export async function list(store: LeagueStore, actor: string) {
  return summary(store, actor);
}
