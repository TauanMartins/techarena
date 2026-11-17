import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appointmentApi } from '../api/appointments.api';
import { BookingForm } from './BookingForm';

vi.mock('../../../auth/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token', user: { id: 'user-1' } },
  }),
}));

afterEach(() => vi.restoreAllMocks());

describe('BookingForm', () => {
  it('shows validation for an empty submission and sends the valid booking payload', async () => {
    const user = userEvent.setup();
    vi.spyOn(appointmentApi, 'sports').mockResolvedValue({
      items: [{ id: 'sport-1', name: 'Futebol', defaultPlayers: 10 }],
    } as never);
    vi.spyOn(appointmentApi, 'arenas').mockResolvedValue({
      items: [
        {
          id: 'arena-1',
          address: 'Arena Central',
          lat: 0,
          longitude: 0,
          image: null,
          isLeagueOnly: false,
          sportIds: ['sport-1'],
          distanceKm: null,
        },
      ],
    } as never);
    vi.spyOn(appointmentApi, 'availability').mockResolvedValue({
      items: [{ id: 'slot-1', horary: '20:00' }],
    } as never);
    const create = vi
      .spyOn(appointmentApi, 'create')
      .mockResolvedValue({ id: 'appointment-1' } as never);
    const onCreated = vi.fn();
    renderWithProviders(<BookingForm onCreated={onCreated} />);

    await screen.findByRole('option', { name: 'Futebol' });
    await user.selectOptions(screen.getByLabelText('Esporte'), 'sport-1');
    await user.selectOptions(screen.getByLabelText('Arena'), 'arena-1');
    await waitFor(() =>
      expect(screen.getByRole('option', { name: '20:00' })).toBeInTheDocument(),
    );
    await user.selectOptions(
      screen.getByLabelText('Horário disponível'),
      'slot-1',
    );
    await user.type(
      screen.getByLabelText('Limite de participantes (opcional)'),
      '0',
    );
    await user.click(
      screen.getByRole('button', { name: 'Publicar agendamento' }),
    );
    expect(
      await screen.findByText('O limite mínimo é 1 participante.'),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nome do evento'), 'Jogo de sábado');
    await user.type(screen.getByLabelText('Descrição'), 'Partida amistosa');
    await user.clear(
      screen.getByLabelText('Limite de participantes (opcional)'),
    );
    await user.type(
      screen.getByLabelText('Limite de participantes (opcional)'),
      '12',
    );
    await user.click(
      screen.getByRole('button', { name: 'Publicar agendamento' }),
    );

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({
          arenaId: 'arena-1',
          sportId: 'sport-1',
          scheduleId: 'slot-1',
          title: 'Jogo de sábado',
          description: 'Partida amistosa',
          holder: true,
          maxPlayers: 12,
        }),
      ),
    );
    expect(onCreated).toHaveBeenCalledOnce();
  });

  it('renders a mutation error and restores the submit action after the request settles', async () => {
    const user = userEvent.setup();
    vi.spyOn(appointmentApi, 'sports').mockResolvedValue({
      items: [{ id: 'sport-1', name: 'Futebol', defaultPlayers: 10 }],
    } as never);
    vi.spyOn(appointmentApi, 'arenas').mockResolvedValue({
      items: [
        {
          id: 'arena-1',
          address: 'Arena Central',
          lat: 0,
          longitude: 0,
          image: null,
          isLeagueOnly: false,
          sportIds: ['sport-1'],
          distanceKm: null,
        },
      ],
    } as never);
    vi.spyOn(appointmentApi, 'availability').mockResolvedValue({
      items: [{ id: 'slot-1', horary: '20:00' }],
    } as never);
    vi.spyOn(appointmentApi, 'create').mockRejectedValue(
      new Error('Não foi possível salvar (500)'),
    );
    renderWithProviders(<BookingForm onCreated={vi.fn()} />);

    await screen.findByRole('option', { name: 'Futebol' });
    await user.selectOptions(screen.getByLabelText('Esporte'), 'sport-1');
    await user.selectOptions(screen.getByLabelText('Arena'), 'arena-1');
    await screen.findByRole('option', { name: '20:00' });
    await user.selectOptions(
      screen.getByLabelText('Horário disponível'),
      'slot-1',
    );
    await user.click(
      screen.getByRole('button', { name: 'Publicar agendamento' }),
    );

    expect(
      await screen.findByText('Não foi possível salvar (500)'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Publicar agendamento' }),
    ).toBeEnabled();
  });
});

it('limits sports to the selected arena and never clears it when switching supported modalities', async () => {
  const user = userEvent.setup();
  const initialArena = {
    id: '42',
    address: 'Quadra poliesportiva',
    lat: 0,
    longitude: 0,
    sportIds: ['1', '2'],
    image: null,
    distanceKm: null,
    isLeagueOnly: false,
  };
  vi.spyOn(appointmentApi, 'sports').mockResolvedValue({
    items: [
      { id: '1', name: 'Futebol' },
      { id: '2', name: 'Vôlei' },
      { id: '3', name: 'Natação' },
    ],
  } as never);
  vi.spyOn(appointmentApi, 'arenas').mockResolvedValue({ items: [] } as never);
  vi.spyOn(appointmentApi, 'availability').mockResolvedValue({
    items: [{ id: '1', horary: '18:00' }],
  });
  renderWithProviders(
    <BookingForm
      onCreated={vi.fn()}
      initialArena={initialArena}
      initialSportId="3"
    />,
  );
  await screen.findByRole('option', { name: 'Futebol' });
  expect(
    screen.queryByRole('option', { name: 'Natação' }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Esporte')).toHaveValue('');
  expect(screen.getByLabelText('Arena')).toBeDisabled();
  await user.selectOptions(screen.getByLabelText('Esporte'), '1');
  expect(screen.getByLabelText('Arena')).toHaveValue('42');
  await user.selectOptions(screen.getByLabelText('Esporte'), '2');
  expect(screen.getByLabelText('Arena')).toHaveValue('42');
  expect(
    screen.queryByLabelText('Buscar arena pelo endereço'),
  ).not.toBeInTheDocument();
});
