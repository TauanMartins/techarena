import type { UserProfile } from '../../profile/domain/profile.js';
export type UserCard = Pick<UserProfile, 'id' | 'name' | 'username' | 'image'>;
