import { ToastNotice } from './ToastNotice';
import Stack from 'react-bootstrap/Stack';
import Spinner from 'react-bootstrap/Spinner';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div
      className="d-flex align-items-center justify-content-center text-body-secondary p-4"
      role="status"
    >
      <Spinner
        animation="border"
        size="sm"
        className="me-2"
      />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <ToastNotice
      message={message}
      error
    />
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
    <div className="d-flex flex-column align-items-center justify-content-center gap-2 p-4 p-md-5 border rounded-4 bg-body text-center">
      <i
        className={`bi ${icon} fs-2 text-primary-emphasis`}
        aria-hidden="true"
      />
      <h3 className="h5 fw-bold mb-0">{title}</h3>
      <p className="text-body-secondary mb-0">{description}</p>
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
    <Stack
      direction="horizontal"
      className="flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4"
    >
      <div>
        <div className="small fw-semibold text-primary-emphasis mb-2">
          {eyebrow}
        </div>
        <h1 className="h2 fw-bold mb-2">{title}</h1>
        <p className="text-body-secondary mb-0">{description}</p>
      </div>
      {action}
    </Stack>
  );
}
