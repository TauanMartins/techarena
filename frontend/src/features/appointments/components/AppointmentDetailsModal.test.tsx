import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/test-utils';
import { api } from '../../../lib/api-client';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import type { Appointment } from '../types/appointments.types';
const appointment: Appointment = {
  id: '1',
  title: 'Jogo',
  description: null,
  scheduledAt: '2999-01-01T10:00:00Z',
  status: 'scheduled',
  organizerId: 'owner',
  arenaId: null,
  sportId: '2',
  scheduleId: null,
  arenaAddress: 'Quadra do bairro',
  arenaImage: null,
  sportName: 'Basquete',
  maxPlayers: 2,
  players: 2,
  startingPlayers: 2,
  isInside: false,
  distanceKm: null,
  participants: [],
};
afterEach(() => vi.restoreAllMocks());
it('shows player materials and permits reserve participation when starting places are full', async () => {
  const user = userEvent.setup();
  vi.spyOn(api, 'getSportMaterials').mockResolvedValue({
    items: [{ id: '1', description: 'Bola', relatedToLocal: false }],
    total: 1,
    totalPages: 1,
    page: 1,
    limit: 50,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const join = vi.fn();
  renderWithProviders(
    <AppointmentDetailsModal
      appointment={appointment}
      token="token"
      show
      onHide={vi.fn()}
      action={join}
    />,
  );
  expect(await screen.findByText('Bola')).toBeInTheDocument();
  expect(screen.getByLabelText('Titular — vagas preenchidas')).toBeDisabled();
  expect(screen.getByLabelText('Entrar como reserva')).toBeChecked();
  await user.click(
    screen.getByRole('button', { name: 'Confirmar participação' }),
  );
  expect(join).toHaveBeenCalledWith(false);
});
it('does not offer participation in a finished match', () => {
  renderWithProviders(
    <AppointmentDetailsModal
      appointment={{ ...appointment, status: 'finished', sportId: null }}
      show
      onHide={vi.fn()}
      action={vi.fn()}
    />,
  );
  expect(
    screen.queryByRole('button', { name: 'Confirmar participação' }),
  ).not.toBeInTheDocument();
});
