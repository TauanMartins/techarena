import { screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/test-utils';
import { api } from '../../../lib/api-client';
import { ConversationMembers } from './ConversationMembers';
afterEach(() => vi.restoreAllMocks());
it('shows actual team members and their roles in the conversation context', async () => {
  const members = vi.spyOn(api, 'listTeamMembers');
  members.mockResolvedValue({
    items: [
      {
        id: 'user',
        name: 'Ana',
        username: 'ana',
        image: null,
        role: 'captain',
        joinedAt: null,
      },
    ],
    total: 1,
    totalPages: 1,
    page: 1,
    limit: 50,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  renderWithProviders(
    <ConversationMembers
      token="token"
      teamId="42"
    />,
  );
  expect(await screen.findByText('Ana')).toBeInTheDocument();
  expect(screen.getByText('Capitão · @ana')).toBeInTheDocument();
  expect(members).toHaveBeenCalledWith('token', '42', 1);
});
