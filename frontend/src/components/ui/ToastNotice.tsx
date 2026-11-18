import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function ToastNotice({
  message,
  error = false,
  onClose,
}: {
  message: string;
  error?: boolean;
  onClose?: () => void;
}) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => {
    if (error) return;
    const timer = window.setTimeout(() => setDismissed(message), 7000);
    return () => window.clearTimeout(timer);
  }, [message, error]);
  if (dismissed === message) return null;
  return createPortal(
    <div
      className="position-fixed top-0 start-50 translate-middle-x p-2"
      style={{
        zIndex: 1100,
        width: 'min(100%, 34rem)',
        paddingTop: 'max(.5rem, env(safe-area-inset-top))',
      }}
    >
      <div
        className="toast show w-100 shadow border"
        role={error ? 'alert' : 'status'}
        aria-live={error ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        <div className="toast-header">
          <i
            className={`bi ${error ? 'bi-exclamation-circle text-danger' : 'bi-check-circle text-success'} me-2`}
            aria-hidden="true"
          />
          <strong className="me-auto">
            {error ? 'Não foi possível concluir' : 'Concluído'}
          </strong>
          <button
            type="button"
            className="btn-close"
            aria-label="Fechar aviso"
            onClick={() => {
              setDismissed(message);
              onClose?.();
            }}
          />
        </div>
        <div className="toast-body bg-body text-body text-break">{message}</div>
      </div>
    </div>,
    document.body,
  );
}
