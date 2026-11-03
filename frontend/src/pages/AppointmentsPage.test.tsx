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
});
