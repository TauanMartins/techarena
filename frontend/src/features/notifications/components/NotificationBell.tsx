import { Link } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useNotificationRealtime } from '../hooks/useNotificationRealtime';

export function NotificationBell({ userId }: { userId: string }) {
  useNotificationRealtime(userId);
  const unread = useUnreadNotifications(userId);
  const count = unread.data;
  return (
    <Link
      to="/notificacoes"
      className="btn border-0 position-relative d-inline-flex align-items-center justify-content-center touch-target p-2 me-2"
      aria-label={
        unread.error
          ? 'Notificações — não foi possível atualizar'
          : count
            ? `Notificações: ${count} não lidas`
            : 'Notificações'
      }
    >
      <span className="position-relative d-inline-flex lh-1">
        <i
          className={`bi ${count ? 'bi-bell-fill text-primary-emphasis' : 'bi-bell text-body'} fs-4`}
          aria-hidden="true"
        />
        {Boolean(count) && (
          <Badge
            bg="primary"
            pill
            className="position-absolute top-0 start-100 translate-middle"
          >
            {count! > 99 ? '99+' : count}
          </Badge>
        )}
      </span>
      {unread.error && (
        <i
          className="bi bi-exclamation-circle-fill position-absolute top-0 end-0 text-warning-emphasis"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
