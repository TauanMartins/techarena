import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="feedback-state" role="status">
      <Spinner animation="border" size="sm" className="me-2" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="danger" role="alert" className="mb-0">
      <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
      {message}
    </Alert>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
