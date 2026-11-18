import { screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/test-utils';
import { notificationsApi } from '../api/notifications.api';
import { NotificationBell } from './NotificationBell';
vi.mock('../hooks/useNotificationRealtime', () => ({
  useNotificationRealtime: vi.fn(),
}));
afterEach(() => vi.restoreAllMocks());
it('places unread count above a filled, borderless bell and caps its visual count', async () => {
  vi.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(120);
  renderWithProviders(<NotificationBell userId="me" />);
  const count = await screen.findByText('99+');
  expect(count).toHaveClass(
    'position-absolute',
    'top-0',
    'start-100',
    'translate-middle',
  );
  const link = screen.getByRole('link', {
    name: 'Notificações: 120 não lidas',
  });
  expect(link).toHaveClass('border-0');
  expect(link.querySelector('i')).toHaveClass('bi-bell-fill');
});
it('shows an outline bell without an empty badge', async () => {
  vi.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(0);
  renderWithProviders(<NotificationBell userId="me" />);
  expect(
    screen.getByRole('link', { name: 'Notificações' }).querySelector('i'),
  ).toHaveClass('bi-bell');
  expect(screen.queryByText('0')).not.toBeInTheDocument();
});
