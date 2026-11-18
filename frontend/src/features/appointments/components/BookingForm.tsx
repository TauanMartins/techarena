import { ToastNotice } from '../../../components/ui/ToastNotice';
import { Link } from 'react-router-dom';
import { useState, type SubmitEvent } from 'react';
import { PageControls } from '../../../components/ui/PageControls';
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
  onChooseMap,
  initialArena,
  initialSportId,
  onCreated,
}: {
  titlePrefix?: string;
  onChooseMap?: () => void;
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
  const [arenaSearch, setArenaSearch] = useState('');
  const [arenaPage, setArenaPage] = useState(1);
  const optionsQuery = useBookingOptions(token, userId, {
    sportId: values.sportId || undefined,
    search: arenaSearch || undefined,
    page: arenaPage,
  });
  const availabilityQuery = useAppointmentAvailability(
    token,
    userId,
    values.arenaId,
    values.sportId,
    values.date,
  );
  const createMutation = useCreateAppointment(token, userId);
  const allSports = optionsQuery.data?.sports ?? [];
  const sports = initialArena
    ? allSports.filter((sport) => initialArena.sportIds.includes(sport.id))
    : allSports;
  const fetchedArenas = optionsQuery.data?.arenas ?? [];
  const arenas =
    selectedArena &&
    !fetchedArenas.some((arena) => arena.id === selectedArena.id)
      ? [selectedArena, ...fetchedArenas]
      : fetchedArenas;
  const availableArenas = (initialArena ? [initialArena] : arenas).filter(
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
          Nenhuma arena disponível para este esporte no momento.
        </Alert>
      )}
      {onChooseMap && (
        <Link
          to={
            values.arenaId
              ? `/?arenaId=${encodeURIComponent(values.arenaId)}`
              : '/'
          }
          onClick={onChooseMap}
        >
          Escolher arena no mapa
        </Link>
      )}
      {!initialArena && (
        <>
          <Form.Group controlId="booking-arena-search">
            <Form.Label>Buscar arena pelo endereço</Form.Label>
            <Form.Control
              value={arenaSearch}
              onChange={(event) => {
                setArenaSearch(event.target.value);
                setArenaPage(1);
              }}
            />
          </Form.Group>
          <PageControls
            page={arenaPage}
            hasNext={optionsQuery.data?.hasNextPage ?? false}
            busy={optionsQuery.isFetching}
            onChange={setArenaPage}
            label="Páginas das arenas para agendar"
          />
        </>
      )}
      <BookingFields
        lockedArena={Boolean(initialArena)}
        sports={sports}
        availableArenas={availableArenas}
        slots={slots}
        values={values}
        today={today}
        titlePrefix={titlePrefix}
        onChange={(name, value) => {
          if (name === 'sportId') setArenaPage(1);
          if (name === 'arenaId')
            setSelectedArena(arenas.find((arena) => arena.id === value));
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
