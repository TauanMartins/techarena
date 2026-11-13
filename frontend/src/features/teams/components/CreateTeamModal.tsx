import type { SubmitEvent } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import type { TeamFormInput } from '../schemas/team.schema';

export function CreateTeamModal({
  show,
  busy,
  errors,
  register,
  onHide,
  onSubmit,
}: {
  show: boolean;
  busy: boolean;
  errors: FieldErrors<TeamFormInput>;
  register: UseFormRegister<TeamFormInput>;
  onHide: () => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Criar equipe</Modal.Title>
      </Modal.Header>
      <Form
        onSubmit={onSubmit}
        noValidate
      >
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="create-team-name">Nome</Form.Label>
            <Form.Control
              id="create-team-name"
              isInvalid={!!errors.name}
              {...register('name')}
            />
            <Form.Control.Feedback type="invalid">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label htmlFor="create-team-description">Descrição</Form.Label>
            <Form.Control
              id="create-team-description"
              as="textarea"
              rows={3}
              isInvalid={!!errors.description}
              {...register('description')}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={onHide}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={busy}
          >
            {busy ? 'Criando...' : 'Criar equipe'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
