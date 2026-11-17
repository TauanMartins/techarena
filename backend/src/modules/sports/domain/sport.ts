import type { PageRequest } from '../../../common/domain/pagination.js';
export interface SportItem {
  id: string;
  name: string;
  defaultPlayers: number;
}
export interface MaterialItem {
  id: string;
  description: string;
  relatedToLocal: boolean;
}
export interface SportsQuery extends PageRequest {
  search?: string;
}
