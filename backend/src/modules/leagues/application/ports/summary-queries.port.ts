import type { SummaryRow } from './league-store.port.js';
export interface SummaryQueries {
  summaryListSummaries(
    actor: string,
    value2: string | null,
  ): Promise<SummaryRow[]>;
}
