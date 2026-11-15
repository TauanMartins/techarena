import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/test-utils';
import { AppShell } from './AppShell';

const authState = vi.hoisted(() => ({
  value: {
    profile: { id: 'user-1', name: 'Ana Silva', username: 'ana', image: null },
    session: { user: { email: 'ana@example.com' } },
    logout: vi.fn(),
    profileError: null as string | null,
    refreshProfile: vi.fn(),
  } as any,
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => authState.value }));

afterEach(() => vi.clearAllMocks());

describe('AppShell', () => {
  it('renders the main navigation and expands community destinations', () => {
    renderWithProviders(<AppShell />, { initialEntries: ['/chat/team/1'] });
    expect(
      screen.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('navigation', { name: 'Navegação principal' }),
      ).getByRole('link', { name: 'Início' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    const communityToggle = screen.getByRole('button', { name: /Comunidades/ });
    expect(communityToggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(communityToggle);
    expect(communityToggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByText('TechArena · esporte é melhor em equipe'),
    ).toBeInTheDocument();
  });

  it('keeps Social selected for nested chats and exposes all social destinations', () => {
    renderWithProviders(<AppShell />, { initialEntries: ['/chat/team/1'] });
    const bottom = within(
      screen.getByRole('navigation', { name: 'Navegação inferior' }),
    );
    expect(bottom.getAllByRole('link')).toHaveLength(5);
    expect(bottom.getByRole('link', { name: 'Comunidade' })).toHaveClass(
      'bg-primary-subtle',
    );
    const social = within(
      screen.getByRole('navigation', { name: 'Navegação social mobile' }),
    );
    expect(social.getByRole('link', { name: 'Comunidade' })).toHaveAttribute(
      'href',
      '/social',
    );
    expect(social.getByRole('link', { name: 'Equipes' })).toHaveAttribute(
      'href',
      '/equipes',
    );
    expect(social.getByRole('link', { name: 'Conversas' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    fireEvent.click(bottom.getByRole('link', { name: 'Agendamentos' }));
    expect(bottom.getByRole('link', { name: 'Agendamentos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(bottom.getByRole('link', { name: 'Comunidade' })).not.toHaveClass(
      'bg-primary-subtle',
    );
    expect(
      screen.queryByRole('navigation', { name: 'Navegação social mobile' }),
    ).not.toBeInTheDocument();
  });

  it('offers profile recovery and logout when the profile is unavailable', async () => {
    authState.value = {
      ...authState.value,
      profile: null,
      profileError: 'profile unavailable',
    };
    authState.value.logout.mockRejectedValueOnce(new Error('logout failed'));
    renderWithProviders(<AppShell />);
    expect(
      screen.getByRole('heading', {
        name: 'Não foi possível carregar seu perfil',
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByText('logout failed')).toBeInTheDocument();
    expect(authState.value.refreshProfile).toHaveBeenCalledOnce();
    expect(authState.value.logout).toHaveBeenCalledOnce();
  });
});
