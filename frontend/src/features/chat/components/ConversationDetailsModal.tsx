import Image from 'react-bootstrap/Image';
import Modal from 'react-bootstrap/Modal';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import type { Conversation } from '../types/conversation.types';

export function ConversationDetailsModal({
  conversation,
  show,
  onHide,
}: {
  conversation?: Conversation;
  show: boolean;
  onHide: () => void;
}) {
  return (
    <Modal
      show={show && Boolean(conversation)}
      onHide={onHide}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Detalhes da conversa</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {conversation && (
          <div className="d-flex flex-column align-items-center gap-2 text-center text-break">
            <span className="d-block small fw-semibold text-body-secondary mb-1">
              {conversation.kind === 'direct'
                ? 'CONVERSA PRIVADA'
                : conversation.kind === 'team'
                  ? 'CONVERSA DE EQUIPE'
                  : 'CONVERSA DO AGENDAMENTO'}
            </span>
            {conversation.image && conversation.kind !== 'direct' && (
              <Image
                height={220}
                className="w-100 object-fit-contain rounded-3"
                src={conversation.image}
                alt={`Imagem de ${conversation.label}`}
                rounded
              />
            )}
            {conversation.kind === 'direct' && (
              <ProfileAvatar
                name={conversation.label}
                image={conversation.image ?? null}
                size={80}
              />
            )}
            <h3>{conversation.label}</h3>
            {conversation.kind === 'direct' && (
              <p>
                {conversation.username
                  ? `@${conversation.username}`
                  : 'Atleta da sua rede'}
              </p>
            )}
            {conversation.kind === 'team' && (
              <>
                <p>
                  {conversation.description ||
                    'Esta equipe ainda não tem uma descrição.'}
                </p>
                {conversation.role && <p>Seu papel: {conversation.role}</p>}
              </>
            )}
            {conversation.kind === 'appointment' && (
              <>
                <p>
                  {conversation.description ||
                    'Sem descrição adicional para este agendamento.'}
                </p>
                {conversation.scheduledAt && (
                  <p>
                    <strong>Data:</strong>{' '}
                    {new Date(conversation.scheduledAt).toLocaleString(
                      'pt-BR',
                      { dateStyle: 'long', timeStyle: 'short' },
                    )}
                  </p>
                )}
                {conversation.status && (
                  <p>
                    <strong>Situação:</strong>{' '}
                    {conversation.status === 'scheduled'
                      ? 'Confirmado'
                      : conversation.status === 'in_progress'
                        ? 'Em andamento'
                        : conversation.status === 'finished'
                          ? 'Finalizado'
                          : 'Cancelado'}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
