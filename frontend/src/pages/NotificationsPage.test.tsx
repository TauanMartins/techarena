import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/test-utils';
import { NotificationsPage } from './NotificationsPage';
import { notificationsApi } from '../features/notifications/api/notifications.api';
vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { access_token: 'token', user: { id: 'me' } } }),
}));
afterEach(() => vi.restoreAllMocks());
const item = {
  id: '1',
  kind: 'system.info',
  title: 'Bem-vindo',
  body: 'Uma novidade',
  target_path: '/social',
  created_at: '2026-11-18T12:00:00Z',
  read_at: null,
};
it('loads, filters and acknowledges notifications using the authenticated identity', async () => {
  const user = userEvent.setup();
  const list = vi
    .spyOn(notificationsApi, 'list')
    .mockResolvedValue({ items: [item], nextCursor: undefined });
  vi.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(1);
  const mark = vi.spyOn(notificationsApi, 'markRead').mockResolvedValue();
  renderWithProviders(<NotificationsPage />);
  await screen.findByText('Bem-vindo');
  expect(list).toHaveBeenCalledWith('me', false, undefined);
  expect(screen.getByRole('link', { name: 'Ver detalhes' })).toHaveAttribute(
    'href',
    '/social',
  );
  await user.click(screen.getByRole('button', { name: 'Marcar como lida' }));
  await waitFor(() => expect(mark).toHaveBeenCalledWith('1'));
  await user.click(screen.getByRole('button', { name: 'Não lidas' }));
  await waitFor(() => expect(list).toHaveBeenCalledWith('me', true, undefined));
  await user.click(
    screen.getByRole('button', { name: 'Marcar todas como lidas' }),
  );
  await waitFor(() => expect(mark).toHaveBeenCalledWith(undefined));
});
it('keeps unread records visible and reports acknowledgment failures', async () => {
  vi.spyOn(notificationsApi, 'list').mockResolvedValue({
    items: [{ ...item, target_path: 'https://evil.test' }],
    nextCursor: undefined,
  });
  vi.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(1);
  vi.spyOn(notificationsApi, 'markRead').mockRejectedValue(
    new Error('Falha ao registrar leitura'),
  );
  renderWithProviders(<NotificationsPage />);
  await screen.findByText('Bem-vindo');
  expect(
    screen.queryByRole('link', { name: 'Ver detalhes' }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Marcar como lida' }),
  );
  expect(
    await screen.findByText('Falha ao registrar leitura'),
  ).toBeInTheDocument();
  expect(screen.getByText('Não lida', { exact: true })).toBeInTheDocument();
});
it('loads more using the server cursor and distinguishes an empty inbox', async () => {
  const list = vi
    .spyOn(notificationsApi, 'list')
    .mockResolvedValueOnce({
      items: [item],
      nextCursor: { id: '1', createdAt: item.created_at },
    })
    .mockResolvedValue({
      items: [
        { ...item, id: '2', title: 'Anterior', read_at: item.created_at },
      ],
      nextCursor: undefined,
    });
  vi.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(0);
  renderWithProviders(<NotificationsPage />);
  await userEvent.click(
    await screen.findByRole('button', { name: 'Carregar mais' }),
  );
  await screen.findByText('Anterior');
  expect(list).toHaveBeenCalledWith('me', false, {
    id: '1',
    createdAt: item.created_at,
  });
  list.mockResolvedValue({ items: [], nextCursor: undefined });
  await userEvent.click(screen.getByRole('button', { name: 'Não lidas' }));
  expect(await screen.findByText('Você está em dia')).toBeInTheDocument();
});
