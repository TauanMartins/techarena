import Modal from 'react-bootstrap/Modal';
import type { Arena } from '../../../shared/types';
import { BookingForm } from './BookingForm';

export function BookingModal({
  show,
  initialArena,
  initialSportId,
  onHide,
  onCreated,
}: {
  show: boolean;
  initialArena?: Arena;
  initialSportId?: string;
  onHide: () => void;
  onCreated: () => void;
}) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      scrollable
      size="lg"
      fullscreen="sm-down"
    >
      <Modal.Header closeButton>
        <Modal.Title>Novo agendamento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <BookingForm
          initialArena={initialArena}
          initialSportId={initialSportId}
          onCreated={() => {
            onCreated();
            onHide();
          }}
        />
      </Modal.Body>
    </Modal>
  );
}
