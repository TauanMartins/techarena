import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import type { SubmitEvent } from 'react';
import type { Profile } from '../types/settings.types';
import type { ProfileFormInput } from '../schemas/profile.schema';

export function ProfileForm({
  profile,
  email,
  today,
  register,
  errors,
  busy,
  onSubmit,
}: {
  profile: Profile | null;
  email: string;
  today: string;
  register: UseFormRegister<ProfileFormInput>;
  errors: FieldErrors<ProfileFormInput>;
  busy: boolean;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}) {
  return (
    <Form
      onSubmit={onSubmit}
      noValidate
    >
      <div className="d-flex align-items-center gap-3 mb-4">
        <ProfileAvatar
          name={null}
          image={profile?.image ?? null}
          size={80}
        />
        <div>
          <strong>Foto de perfil</strong>
          <p className="mb-0">
            A foto vinculada à sua conta é exibida aqui e não pode ser alterada
            nesta tela.
          </p>
        </div>
      </div>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="profile-name">Nome</Form.Label>
        <Form.Control
          id="profile-name"
          autoComplete="name"
          isInvalid={!!errors.name}
          {...register('name')}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="profile-username">Nome de usuário</Form.Label>
        <Form.Control
          id="profile-username"
          aria-describedby="username-help"
          autoComplete="username"
          isInvalid={!!errors.username}
          {...register('username')}
        />
        <Form.Text id="username-help">
          Use letras minúsculas, números e sublinhado.
        </Form.Text>
        <Form.Control.Feedback type="invalid">
          {errors.username?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="profile-birth-date">Data de nascimento</Form.Label>
        <Form.Control
          id="profile-birth-date"
          type="date"
          max={today}
          autoComplete="bday"
          aria-describedby="birth-date-help"
          isInvalid={!!errors.birthDate}
          {...register('birthDate')}
        />
        <Form.Text id="birth-date-help">
          Informe uma data válida. É necessário ter pelo menos 18 anos para
          participar de agendamentos.
        </Form.Text>
        <Form.Control.Feedback type="invalid">
          {errors.birthDate?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="profile-gender">Gênero</Form.Label>
        <Form.Select
          id="profile-gender"
          isInvalid={!!errors.gender}
          {...register('gender')}
        >
          <option value="">Prefiro não informar</option>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
          <option value="O">Outro</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-4">
        <Form.Label htmlFor="profile-email">E-mail</Form.Label>
        <Form.Control
          id="profile-email"
          value={email}
          disabled
          readOnly
        />
        <Form.Text>
          O e-mail é gerenciado pelo provedor de autenticação.
        </Form.Text>
      </Form.Group>
      <Button
        type="submit"
        disabled={busy}
      >
        {busy ? 'Salvando...' : 'Salvar perfil'}
      </Button>
    </Form>
  );
}
