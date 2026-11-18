import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ConversationList } from './ConversationList';
it('keeps friendships and teams visible while hiding old or canceled appointments by default', () => {
  render(
    <ConversationList
      conversations={[
        { id: '1', kind: 'direct', label: 'Amizade' },
        { id: '2', kind: 'team', label: 'Equipe' },
        {
          id: '3',
          kind: 'appointment',
          label: 'Anterior',
          status: 'scheduled',
          scheduledAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '4',
          kind: 'appointment',
          label: 'Cancelado',
          status: 'canceled',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: '5',
          kind: 'appointment',
          label: 'Próximo',
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        },
      ]}
      loading={false}
      onRefresh={vi.fn()}
      onOpen={vi.fn()}
    />,
  );
  expect(screen.getByText('Amizade')).toBeVisible();
  expect(screen.getByText('Equipe')).toBeVisible();
  expect(screen.getByText('Próximo')).toBeVisible();
  expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
  expect(screen.queryByText('Cancelado')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Equipes' }));
  expect(screen.queryByText('Amizade')).not.toBeInTheDocument();
  expect(screen.getByText('Equipe')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Agendamentos' }));
  expect(screen.queryByText('Equipe')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Incluir encerrados' }));
  expect(screen.getByText('Anterior')).toBeVisible();
  expect(screen.getByText('Cancelado')).toBeVisible();
});

it('uses exactly one Bootstrap color variant for each category', () => {
  render(
    <ConversationList
      conversations={[]}
      loading={false}
      onRefresh={vi.fn()}
      onOpen={vi.fn()}
    />,
  );
  const all = screen.getByRole('button', { name: 'Todas' });
  const teams = screen.getByRole('button', { name: 'Equipes' });
  expect(all).toHaveClass('btn-primary');
  expect(teams).toHaveClass('btn-outline-secondary');
  expect(teams).not.toHaveClass('btn-primary');
  fireEvent.click(teams);
  expect(all).not.toHaveClass('btn-primary');
  expect(teams).toHaveClass('btn-primary');
});
