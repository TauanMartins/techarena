import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appointmentApi } from '../features/appointments/api/appointments.api';
import { AppointmentsPage } from './AppointmentsPage';

vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ session: { access_token: 'token', user: { id: 'user-1' } } }) }));

afterEach(() => vi.restoreAllMocks());

describe('AppointmentsPage', () => {
  it('loads the appointment list and opens the booking flow', async () => {
    const user = userEvent.setup();
    vi.spyOn(appointmentApi, 'list').mockResolvedValue({ items: [], total: 0 } as never);
    vi.spyOn(appointmentApi, 'sports').mockResolvedValue({ items: [] } as never);
    vi.spyOn(appointmentApi, 'arenas').mockResolvedValue({ items: [] } as never);
    renderWithProviders(<AppointmentsPage />);

    expect(await screen.findByText('Nenhum agendamento encontrado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Criar agendamento' }));
    expect(await screen.findByText('Novo agendamento')).toBeInTheDocument();
  });

  it('renders query failures instead of an empty result state', async () => {
    vi.spyOn(appointmentApi, 'list').mockRejectedValue(new Error('Serviço indisponível (503)'));
    renderWithProviders(<AppointmentsPage />);
    expect(await screen.findByText('Serviço indisponível (503)')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum agendamento encontrado')).not.toBeInTheDocument();
  });

  it('joins a scheduled appointment and reports the successful action', async () => {
    const user = userEvent.setup();
    const appointment = {
      id: 'appointment-1', title: 'Futebol de sábado', description: null, scheduledAt: '2999-01-01T10:00:00Z', status: 'scheduled',
      organizerId: 'organizer-1', arenaId: null, sportId: null, scheduleId: null, arenaAddress: null, arenaImage: null, sportName: 'Futebol',
      maxPlayers: 12, players: 2, startingPlayers: 1, isInside: false, distanceKm: null, participants: [],
    };
    vi.spyOn(appointmentApi, 'list').mockResolvedValue({ items: [appointment, { ...appointment, id: 'owned-appointment', title: 'Minha partida', organizerId: 'user-1' }], total: 2 } as never);
    const join = vi.spyOn(appointmentApi, 'join').mockResolvedValue({ success: true } as never);
    renderWithProviders(<AppointmentsPage />);

    await user.click(await screen.findByRole('button', { name: 'Participar' }));
    await vi.waitFor(() => expect(join).toHaveBeenCalledWith('token', 'appointment-1'));
    expect(await screen.findByRole('status')).toHaveTextContent('Você entrou no agendamento.');
    await user.click(screen.getByRole('button', { name: 'Ir para conversa' }));
  });
});
