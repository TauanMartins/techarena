import type { UserProfile, ProfileChanges } from './profile.js';

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');
export interface ProfileRepository {
  findById(id: string): Promise<UserProfile | null>;
  update(id: string, changes: ProfileChanges): Promise<UserProfile>;
}
