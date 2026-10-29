import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from './SettingsPage';

const { apiMock, authMock, themeMock } = vi.hoisted(() => ({
  apiMock: {
    getSports: vi.fn(),
    getFavoriteSports: vi.fn(),
    updateProfile: vi.fn(),
    replaceFavoriteSports: vi.fn(),
  },
  authMock: {
    refreshProfile: vi.fn(),
    logout: vi.fn(),
    session: {
      access_token: 'access-token',
      user: { email: 'athlete@example.com' },
    },
    profile: {
      id: 'user-id',
      name: 'Atleta',
      username: 'atleta',
      image: null as string | null,
      permission: 'user',
      email: 'athlete@example.com',
      birthDate: null,
      gender: null as string | null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  },
  themeMock: {
    theme: 'system' as const,
    saveTheme: vi.fn(),
    error: null,
  },
}));

vi.mock('../shared/api', () => ({ api: apiMock }));
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => authMock }));
vi.mock('../features/preferences/ThemeProvider', () => ({
  useThemePreference: () => themeMock,
}));

describe('SettingsPage profile settings', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    authMock.profile.gender = null;
    authMock.profile.image = null;
    apiMock.getSports.mockResolvedValue({ items: [] });
    apiMock.getFavoriteSports.mockResolvedValue({
      maxFavorites: 5,
      remainingSlots: 5,
      items: [],
    });
    apiMock.updateProfile.mockResolvedValue(authMock.profile);
    authMock.refreshProfile.mockResolvedValue(undefined);
  });

  it('updates all editable profile fields, including birth date', async () => {
    const user = userEvent.setup();
    authMock.profile.image = 'https://example.com/avatar.png';
    render(<SettingsPage />);

    expect(screen.getByRole('img', { name: 'Foto de perfil' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.png',
    );
    expect(screen.queryByLabelText('URL da imagem de perfil')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Nome'));
    await user.type(screen.getByLabelText('Nome'), 'Atleta Exemplo');
    await user.clear(screen.getByLabelText('Nome de usuário'));
    await user.type(screen.getByLabelText('Nome de usuário'), 'atleta_exemplo');
    fireEvent.change(screen.getByLabelText('Data de nascimento'), {
      target: { value: '1990-05-12' },
    });
    await user.selectOptions(screen.getByLabelText('Gênero'), 'O');
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    await waitFor(() => {
      expect(apiMock.updateProfile).toHaveBeenCalledWith('access-token', {
        name: 'Atleta Exemplo',
        username: 'atleta_exemplo',
        birthDate: '1990-05-12',
        gender: 'O',
      });
    });
    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument();
  });

  it('clears gender when the user chooses not to disclose it', async () => {
    const user = userEvent.setup();
    authMock.profile.gender = 'F';
    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText('Data de nascimento'), {
      target: { value: '1990-05-12' },
    });
    await user.selectOptions(screen.getByLabelText('Gênero'), '');
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    await waitFor(() => {
      expect(apiMock.updateProfile).toHaveBeenCalledWith(
        'access-token',
        expect.objectContaining({ gender: null }),
      );
    });
  });
});
