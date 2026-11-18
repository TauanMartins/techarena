import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import type { AppNotification } from '../types/notification';
import { notificationTarget } from '../notification-target';

export function NotificationItem({
  item,
  pending,
  onRead,
}: {
  item: AppNotification;
  pending: boolean;
  onRead: (id: string) => void;
}) {
  const target = notificationTarget(item.target_path);
  return (
    <li
      className={`list-group-item p-3 ${!item.read_at ? 'bg-primary-subtle' : 'bg-body'}`}
    >
      <div className="d-flex align-items-start gap-2">
        <i
          className={`bi ${item.read_at ? 'bi-envelope-open' : 'bi-envelope-fill'} text-primary-emphasis flex-shrink-0`}
          aria-hidden="true"
        />
        <div className="flex-grow-1 overflow-hidden">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h2 className="h6 mb-0 text-break">{item.title}</h2>
            {!item.read_at && (
              <span className="badge text-bg-primary">Não lida</span>
            )}
          </div>
          <p className="text-break my-2">{item.body}</p>
          <time
            dateTime={item.created_at}
            className="small text-body-secondary"
          >
            {new Date(item.created_at).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </time>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {target && (
              <Link
                to={target}
                className="btn btn-sm btn-outline-secondary"
              >
                Ver detalhes
              </Link>
            )}
            {!item.read_at && (
              <Button
                variant="link"
                className="text-primary-emphasis"
                size="sm"
                disabled={pending}
                onClick={() => onRead(item.id)}
              >
                Marcar como lida
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
