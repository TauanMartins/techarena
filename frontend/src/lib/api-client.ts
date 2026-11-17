import { profileClient } from './api/profile-client';
import { chatClient } from './api/chat-client';
import { catalogClient } from './api/catalog-client';
import { appointmentsClient } from './api/appointments-client';
import { teamsClient } from './api/teams-client';
import { leaguesClient } from './api/leagues-client';
import { communityClient } from './api/community-client';
export { ApiError } from './api/api-error';
export { apiRequest } from './api/api-request';
export const api = {
  ...profileClient,
  ...chatClient,
  ...catalogClient,
  ...appointmentsClient,
  ...teamsClient,
  ...leaguesClient,
  ...communityClient,
};
