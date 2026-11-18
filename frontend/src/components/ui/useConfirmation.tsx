import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { notifyFeedback } from './notify-feedback';

interface Confirmation {
  title: string;
  message: string;
  label: string;
  onConfirm: () => Promise<unknown> | void;
}
export function useConfirmation() {
  const [action, request] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const close = () => {
    if (!busy) request(null);
  };
  async function confirm() {
    if (!action || busy) return;
    setBusy(true);
    try {
      await action.onConfirm();
      request(null);
    } catch (error) {
      notifyFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a ação.',
        true,
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    request,
    open: Boolean(action),
    dialog: (
      <Modal
        show={Boolean(action)}
        onHide={close}
        centered
        backdrop={busy ? 'static' : true}
        keyboard={!busy}
      >
        <Modal.Header closeButton={!busy}>
          <Modal.Title>{action?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{action?.message}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={close}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => void confirm()}
            disabled={busy}
          >
            {busy ? 'Aguarde...' : action?.label}
          </Button>
        </Modal.Footer>
      </Modal>
    ),
  };
}
