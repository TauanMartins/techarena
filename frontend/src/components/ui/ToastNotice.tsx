import { useDesktopViewport } from '../../shared/hooks/useDesktopViewport';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Button from 'react-bootstrap/Button';

export function ToastNotice({
  message,
  error = false,
  requiresAcknowledgment = error,
  onClose,
}: {
  message: string;
  error?: boolean;
  requiresAcknowledgment?: boolean;
  onClose?: () => void;
}) {
  const desktop = useDesktopViewport();
  const [dismissed, setDismissed] = useState<string | null>(null);
  // React Bootstrap 2 fixes these attributes to "alert/assertive". Routine
  // confirmations should be polite and must not interrupt screen readers.
  const accessibleToast = useCallback(
    (element: HTMLDivElement | null) => {
      element?.setAttribute('role', error ? 'alert' : 'status');
      element?.setAttribute('aria-live', error ? 'assertive' : 'polite');
    },
    [error],
  );
  const close = () => {
    setDismissed(message);
    onClose?.();
  };
  if (dismissed === message) return null;
  return createPortal(
    <ToastContainer
      position={desktop ? 'bottom-end' : 'top-center'}
      className="position-fixed px-2 pb-2"
      style={{
        paddingTop: desktop
          ? undefined
          : 'max(.5rem, env(safe-area-inset-top))',
      }}
    >
      <Toast
        key={message}
        ref={accessibleToast}
        show
        onClose={close}
        autohide={!requiresAcknowledgment}
        delay={6000}
        className="shadow bg-body text-body border overflow-hidden"
        animation={false}
      >
        <Toast.Header
          closeLabel="Fechar aviso"
          closeButton={!requiresAcknowledgment}
        >
          <i
            className={`bi ${error ? 'bi-exclamation-circle text-danger' : 'bi-check-circle text-success'} me-2`}
            aria-hidden="true"
          />
          <strong className="me-auto">
            {error ? 'Não foi possível concluir' : 'Concluído'}
          </strong>
        </Toast.Header>
        <Toast.Body className="text-break">
          {message}
          {requiresAcknowledgment && (
            <div className="text-end mt-2">
              <Button
                size="sm"
                variant={error ? 'outline-danger' : 'outline-primary'}
                onClick={close}
              >
                Entendi
              </Button>
            </div>
          )}
        </Toast.Body>
      </Toast>
    </ToastContainer>,
    document.body,
  );
}
