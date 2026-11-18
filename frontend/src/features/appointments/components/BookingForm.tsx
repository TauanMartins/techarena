import { ToastNotice } from '../../../components/ui/ToastNotice';
import { useLocation } from '../../arenas/hooks/useLocation';
import { BookingArenaPicker } from './BookingArenaPicker';
import { useState, type SubmitEvent } from 'react';
import type { Arena } from '../../../shared/types';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAuthenticatedSession } from '../../../auth/useAuthenticatedSession';
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
  initialArena,
  initialSportId,
  onCreated,
}: {
  titlePrefix?: string;
  initialArena?: Arena;
  initialSportId?: string;
  onCreated: () => void;
}) {
  const { token, userId } = useAuthenticatedSession();
  const [today] = useState(dateInputToday);
  const [values, setValues] = useState<BookingFormInput>(() => ({
    sportId:
      (initialSportId &&
      (!initialArena || initialArena.sportIds.includes(initialSportId))
        ? initialSportId
        : '') ||
      (initialArena?.sportIds.length === 1 ? initialArena.sportIds[0] : ''),
    arenaId: initialArena?.id ?? '',
    scheduleId: '',
    date: today,
    title: '',
    description: '',
    maxPlayers: '',
  }));
  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingFormInput, string>>
  >({});
  const [selectedArena, setSelectedArena] = useState(initialArena);
  const [holder, setHolder] = useState(true);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const optionsQuery = useBookingOptions(
    token,
    userId,
    location.point ? { ...location.point, radiusKm: 100 } : {},
  );
  const availabilityQuery = useAppointmentAvailability(
    token,
    userId,
    values.arenaId,
    values.sportId,
    values.date,
  );
  const createMutation = useCreateAppointment(token, userId);
  const allSports = optionsQuery.data?.sports ?? [];
  const sports = selectedArena
    ? allSports.filter((sport) => selectedArena.sportIds.includes(sport.id))
    : [];
  const fetchedArenas = optionsQuery.data?.arenas ?? [];
  const arenas =
    selectedArena &&
    !fetchedArenas.some((arena) => arena.id === selectedArena.id)
      ? [selectedArena, ...fetchedArenas]
      : fetchedArenas;
  const slots = availabilityQuery.data?.items ?? [];

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slots.some((slot) => slot.id === values.scheduleId)) {
      setErrors((current) => ({
        ...current,
        scheduleId: 'Selecione um horário disponível.',
      }));
      return;
    }
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
        holder,
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
      {success && <ToastNotice message={'Agendamento criado com sucesso.'} />}
      {(optionsQuery.isPending || availabilityQuery.isFetching) && (
        <div className="small text-body-secondary">Atualizando opções...</div>
      )}
      {!optionsQuery.isPending && arenas.length === 0 && (
        <Alert variant="info">
          Nenhuma quadra disponível nesta região no momento.
        </Alert>
      )}
      <BookingArenaPicker
        arenas={initialArena ? [initialArena] : arenas}
        selected={selectedArena}
        locked={Boolean(initialArena)}
        loading={optionsQuery.isPending}
        location={location}
        error={errors.arenaId}
        onSelect={(arena) => {
          setSelectedArena(arena);
          setValues((current) => ({
            ...current,
            arenaId: arena.id,
            sportId: arena.sportIds.includes(current.sportId)
              ? current.sportId
              : arena.sportIds.length === 1
                ? arena.sportIds[0]
                : '',
            scheduleId: '',
          }));
          setErrors((current) => ({
            ...current,
            arenaId: undefined,
            sportId: undefined,
            scheduleId: undefined,
          }));
        }}
      />
      <BookingFields
        sports={sports}
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
      <Form.Check
        id="booking-holder"
        label="Participar como titular (desmarque para reserva)"
        checked={holder}
        onChange={(event) => setHolder(event.target.checked)}
      />
      <Button
        type="submit"
        className="w-100"
        disabled={
          createMutation.isPending ||
          optionsQuery.isPending ||
          availabilityQuery.isFetching ||
          !slots.some((slot) => slot.id === values.scheduleId)
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
