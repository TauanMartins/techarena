import Modal from 'react-bootstrap/Modal';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import type { UserCard } from '../types/community.types';

export function AthleteDetailsModal({
  person,
  onHide,
}: {
  person: UserCard | null;
  onHide: () => void;
}) {
  return (
    <Modal
      show={person !== null}
      onHide={onHide}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Perfil do atleta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {person && (
          <div className="d-flex flex-column align-items-center gap-2 text-center text-break">
            <ProfileAvatar
              name={person.name}
              image={person.image}
              size={80}
            />
            <h3>{person.name ?? 'Atleta'}</h3>
            <p>
              {person.username
                ? `@${person.username}`
                : 'Nome de usuário não informado'}
            </p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
