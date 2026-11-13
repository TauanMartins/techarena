import { useState, type SubmitEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useAuth } from '../../../auth/useAuth';
import { ApiError } from '../../../lib/api-client';
import {
  bookingFormSchema,
  type BookingFormInput,
} from '../schemas/booking.schema';
import {
  useAppointmentAvailability,
  useBookingOptions,
  useCreateAppointment,
} from '../api/appointments.api';
import { ErrorState } from '../../../components/ui/Feedback';
import { BookingFields } from './BookingFields';

function dateInputToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function BookingForm({
  titlePrefix = 'Partida de',
  onCreated,
}: {
  titlePrefix?: string;
  onCreated: () => void;
}) {
  const { session } = useAuth();
  const token = session!.access_token;
  const userId = session!.user.id;
  const [today] = useState(dateInputToday);
  const [values, setValues] = useState<BookingFormInput>(() => ({
    sportId: '',
    arenaId: '',
    scheduleId: '',
    date: today,
    title: '',
    description: '',
    maxPlayers: '',
  }));
  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingFormInput, string>>
  >({});
  const [success, setSuccess] = useState(false);
  const optionsQuery = useBookingOptions(token, userId);
  const availabilityQuery = useAppointmentAvailability(
    token,
    userId,
    values.arenaId,
    values.sportId,
    values.date,
  );
  const createMutation = useCreateAppointment(token, userId);
  const sports = optionsQuery.data?.sports ?? [];
  const arenas = optionsQuery.data?.arenas ?? [];
  const availableArenas = arenas.filter(
    (arena) => !values.sportId || arena.sportIds.includes(values.sportId),
  );
  const slots = availabilityQuery.data?.items ?? [];

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = bookingFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof BookingFormInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof BookingFormInput;
        if (field in values && !nextErrors[field])
          nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    const booking = parsed.data;
    setSuccess(false);
    createMutation.mutate(
      {
        arenaId: booking.arenaId,
        sportId: booking.sportId,
        date: booking.date,
        scheduleId: booking.scheduleId,
        title:
          booking.title ||
          `${titlePrefix} ${sports.find((sport) => sport.id === booking.sportId)?.name ?? 'esporte'}`,
        description: booking.description || undefined,
        holder: true,
        maxPlayers: booking.maxPlayers,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setValues((current) => ({
            ...current,
            title: '',
            description: '',
            maxPlayers: '',
            scheduleId: '',
          }));
          onCreated();
        },
      },
    );
  }
  const cause =
    createMutation.error ?? availabilityQuery.error ?? optionsQuery.error;
  const errorMessage = cause
    ? cause instanceof ApiError || cause instanceof Error
      ? cause.message
      : 'Não foi possível concluir a solicitação.'
    : null;

  return (
    <Form
      onSubmit={submit}
      className="d-grid gap-2"
      noValidate
    >
      {errorMessage && <ErrorState message={errorMessage} />}
      {success && (
        <Alert variant="success">Agendamento criado com sucesso.</Alert>
      )}
      {(optionsQuery.isPending || availabilityQuery.isFetching) && (
        <div className="small text-body-secondary">Atualizando opções...</div>
      )}
      {!optionsQuery.isPending && arenas.length === 0 && (
        <Alert variant="info">
          Nenhuma arena disponível para este esporte no momento.
        </Alert>
      )}
      <BookingFields
        sports={sports}
        availableArenas={availableArenas}
        slots={slots}
        values={values}
        today={today}
        titlePrefix={titlePrefix}
        onChange={(name, value) => {
          setValues((current) => ({ ...current, [name]: value }));
          setErrors((current) => {
            const next = { ...current };
            delete next[name];
            return next;
          });
        }}
        errors={errors}
      />
      <Button
        type="submit"
        className="w-100"
        disabled={
          createMutation.isPending ||
          optionsQuery.isPending ||
          availabilityQuery.isFetching ||
          !values.scheduleId
        }
      >
        {createMutation.isPending
          ? 'Salvando...'
          : titlePrefix.startsWith('Torneio')
            ? 'Criar evento de liga'
            : 'Publicar agendamento'}
      </Button>
    </Form>
  );
}

export function BookingModal({
  show,
  onHide,
  onCreated,
}: {
  show: boolean;
  onHide: () => void;
  onCreated: () => void;
}) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Novo agendamento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <BookingForm
          onCreated={() => {
            onCreated();
            onHide();
          }}
        />
      </Modal.Body>
    </Modal>
  );
}
