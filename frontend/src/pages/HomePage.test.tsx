import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appointmentApi } from '../features/appointments/api/appointments.api';
import { HomePage } from './HomePage';

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token', user: { id: 'user-1' } },
    profile: { name: 'Ana Silva' },
  }),
}));

afterEach(() => vi.restoreAllMocks());

describe('HomePage', () => {
  it('loads the personalized dashboard and links athletes to choose favorite sports', async () => {
    const user = userEvent.setup();
    vi.spyOn(appointmentApi, 'list').mockResolvedValue({
      items: [],
      total: 0,
    } as never);
    vi.spyOn(appointmentApi, 'favorites').mockResolvedValue({
      maxFavorites: 5,
      remainingSlots: 5,
      items: [],
    } as never);
    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('heading', { name: 'Olá, Ana!' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Escolha até 5 esportes para personalizar suas recomendações.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Escolher modalidades' }),
    ).toHaveAttribute('href', '/configuracoes');
    expect(
      await screen.findByText('Ainda não há partidas por aqui'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Criar agendamento' }));
    expect(await screen.findByText('Novo agendamento')).toBeInTheDocument();
  });

  it('renders a populated dashboard and opens appointment details', async () => {
    const user = userEvent.setup();
    vi.spyOn(appointmentApi, 'list').mockResolvedValue({
      items: [
        {
          id: 'appointment-1',
          title: 'Jogo de domingo',
          description: null,
          scheduledAt: '2999-01-01T10:00:00Z',
          status: 'scheduled',
          organizerId: 'user-1',
          arenaId: null,
          sportId: null,
          scheduleId: null,
          arenaAddress: null,
          arenaImage: null,
          sportName: 'Futebol',
          maxPlayers: null,
          players: 1,
          startingPlayers: 1,
          isInside: true,
          distanceKm: null,
          participants: [],
        },
      ],
      total: 1,
    } as never);
    vi.spyOn(appointmentApi, 'favorites').mockResolvedValue({
      maxFavorites: 5,
      remainingSlots: 4,
      items: [{ id: 'sport-1', name: 'Futebol' }],
    } as never);
    renderWithProviders(<HomePage />);

    await screen.findByRole('heading', { name: 'Jogo de domingo' });
    expect(screen.getAllByText('Futebol')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Ver detalhes' }));
    expect(await screen.findByText('Data e horário')).toBeInTheDocument();
  });
});
