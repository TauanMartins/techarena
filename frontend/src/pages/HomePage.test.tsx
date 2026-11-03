import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appointmentApi } from '../features/appointments/api/appointments.api';
import { HomePage } from './HomePage';

vi.mock('../auth/useAuth', () => ({ useAuth: () => ({
  session: { access_token: 'token', user: { id: 'user-1' } },
  profile: { name: 'Ana Silva' },
}) }));

afterEach(() => vi.restoreAllMocks());

describe('HomePage', () => {
  it('loads the personalized dashboard and links athletes to choose favorite sports', async () => {
    vi.spyOn(appointmentApi, 'list').mockResolvedValue({ items: [], total: 0 } as never);
    vi.spyOn(appointmentApi, 'favorites').mockResolvedValue({ maxFavorites: 5, remainingSlots: 5, items: [] } as never);
    renderWithProviders(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Olá, Ana!' })).toBeInTheDocument();
    expect(await screen.findByText('Escolha até 5 esportes para personalizar suas recomendações.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Escolher modalidades' })).toHaveAttribute('href', '/configuracoes');
    expect(await screen.findByText('Ainda não há partidas por aqui')).toBeInTheDocument();
  });
});
