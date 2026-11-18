import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useAuthenticatedSession } from '../auth/useAuthenticatedSession';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from '../components/ui/Feedback';
import { useNotifications } from '../features/notifications/hooks/useNotifications';
import { useUnreadNotifications } from '../features/notifications/hooks/useUnreadNotifications';
import { ToastNotice } from '../components/ui/ToastNotice';
import { NotificationItem } from '../features/notifications/components/NotificationItem';

export function NotificationsPage() {
  const { userId } = useAuthenticatedSession();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { inbox, markRead } = useNotifications(userId, unreadOnly);
  const count = useUnreadNotifications(userId);
  const items = inbox.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section>
      <PageHeading
        eyebrow="SUA ATIVIDADE"
        title="Notificações"
        description="Acompanhe suas novidades e marque o que já leu."
      />
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div
          role="group"
          aria-label="Filtrar notificações"
          className="d-flex gap-2"
        >
          <Button
            variant={!unreadOnly ? 'primary' : 'outline-secondary'}
            onClick={() => setUnreadOnly(false)}
            aria-pressed={!unreadOnly}
          >
            Todas
          </Button>
          <Button
            variant={unreadOnly ? 'primary' : 'outline-secondary'}
            onClick={() => setUnreadOnly(true)}
            aria-pressed={unreadOnly}
          >
            Não lidas
          </Button>
        </div>
        <Button
          variant="outline-secondary"
          className="ms-sm-auto"
          disabled={markRead.isPending || !count.data}
          onClick={() => markRead.mutate(undefined)}
        >
          Marcar todas como lidas
        </Button>
        <Button
          variant="link"
          disabled={inbox.isFetching}
          onClick={() => {
            void inbox.refetch();
            void count.refetch();
          }}
        >
          Atualizar
        </Button>
      </div>
      {markRead.error && (
        <ToastNotice
          message={markRead.error.message}
          error
          onClose={() => markRead.reset()}
        />
      )}
      {inbox.isPending ? (
        <LoadingState label="Carregando notificações..." />
      ) : inbox.error ? (
        <ErrorState message={inbox.error.message} />
      ) : !items.length ? (
        <EmptyState
          icon="bi-bell"
          title={
            unreadOnly ? 'Você está em dia' : 'Nenhuma notificação por enquanto'
          }
          description="As novas notificações aparecerão aqui."
        />
      ) : (
        <ul className="list-group mb-3">
          {items.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              pending={markRead.isPending}
              onRead={(id) => markRead.mutate(id)}
            />
          ))}
        </ul>
      )}
      {inbox.hasNextPage && (
        <Button
          variant="outline-primary"
          disabled={inbox.isFetchingNextPage}
          onClick={() => void inbox.fetchNextPage()}
        >
          {inbox.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
        </Button>
      )}
    </section>
  );
}
