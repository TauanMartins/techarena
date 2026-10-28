import type {
  PageRequest,
  SortOrder,
} from '../../../shared/domain/pagination.js';
export interface TeamSummary {
  id: string;
  name: string;
  role: string;
  description: string | null;
  image: string | null;
  joinedAt: Date | null;
}
export interface TeamMembershipQuery extends PageRequest {
  search?: string;
  role?: 'captain' | 'member';
  sortBy: 'joinedAt' | 'name';
  sortOrder: SortOrder;
}
