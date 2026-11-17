import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/test-utils';
import { teamsApi } from '../api/teams.api';
import { EditTeamForm } from './EditTeamForm';
import { TeamNameAvailability } from './TeamNameAvailability';
vi.mock('../../../auth/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token', user: { id: 'user-1' } },
  }),
}));
afterEach(() => vi.restoreAllMocks());
const team = {
  id: '1',
  name: 'Equipe A',
  description: 'Descrição antiga',
  image: 'https://example.com/team.jpg',
};
it('updates team text while preserving its photo and refreshes dependent views', async () => {
  const user = userEvent.setup();
  vi.spyOn(teamsApi, 'nameExists').mockResolvedValue({ exists: false });
  const update = vi.spyOn(teamsApi, 'update').mockResolvedValue({
    ...team,
    name: 'Equipe B',
    description: '',
    createdAt: '',
  });
  const onSaved = vi.fn();
  const { queryClient } = renderWithProviders(
    <EditTeamForm
      team={team}
      onSaved={onSaved}
    />,
  );
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  await user.click(screen.getByRole('button', { name: 'Editar equipe' }));
  await user.clear(screen.getByLabelText('Nome da equipe'));
  await user.type(screen.getByLabelText('Nome da equipe'), 'Equipe B');
  expect(await screen.findByText('Nome disponível.')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Descrição da equipe'));
  await user.click(screen.getByRole('button', { name: 'Salvar equipe' }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith(
      'token',
      '1',
      'Equipe B',
      '',
      team.image,
    ),
  );
  expect(onSaved).toHaveBeenCalled();
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: ['chatConversations', 'user-1'],
  });
});
it('keeps edits visible after API failure and supports cancellation', async () => {
  const user = userEvent.setup();
  vi.spyOn(teamsApi, 'update').mockRejectedValue(
    new Error('Apenas o capitão pode editar'),
  );
  renderWithProviders(
    <EditTeamForm
      team={team}
      onSaved={vi.fn()}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Editar equipe' }));
  await user.click(screen.getByRole('button', { name: 'Salvar equipe' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Apenas o capitão',
  );
  await user.click(screen.getByRole('button', { name: 'Cancelar edição' }));
  expect(screen.queryByLabelText('Nome da equipe')).not.toBeInTheDocument();
});
it('reports unavailable names and gracefully handles lookup errors', async () => {
  const exists = vi
    .spyOn(teamsApi, 'nameExists')
    .mockResolvedValue({ exists: true });
  const { unmount } = renderWithProviders(
    <TeamNameAvailability name="Existente" />,
  );
  expect(
    await screen.findByText('Já existe uma equipe com esse nome.'),
  ).toBeInTheDocument();
  unmount();
  exists.mockRejectedValue(new Error('Offline'));
  renderWithProviders(<TeamNameAvailability name="Outra" />);
  expect(
    await screen.findByText(/O nome será validado ao salvar/),
  ).toBeInTheDocument();
});
