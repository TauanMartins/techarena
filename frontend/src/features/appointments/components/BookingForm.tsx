import { useMemo, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../auth/useAuth';
import { api, ApiError } from '../../../shared/api';
import { queryKeys } from '../../../shared/queryClient';
import {
  bookingFormSchema,
  type BookingFormInput,
  type BookingFormValues,
} from '../schemas/booking.schema';
import { ErrorState } from '../../../components/Feedback';

function dateInputToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const queryClient = useQueryClient();
  const today = useMemo(dateInputToday, []);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput, undefined, BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      sportId: '',
      arenaId: '',
      scheduleId: '',
      date: today,
      title: '',
      description: '',
      maxPlayers: '',
    },
  });
  const sportId = watch('sportId');
  const arenaId = watch('arenaId');
  const date = watch('date');
  const scheduleId = watch('scheduleId');
  const [success, setSuccess] = useState(false);

  const optionsQuery = useQuery({
    queryKey: ['bookingOptions', userId],
    queryFn: async () => {
      const [sportPage, arenaPage] = await Promise.all([
        api.getSports(token),
        api.listArenas(token),
      ]);
      return {
        sports: sportPage.items,
        arenas: arenaPage.items.filter((arena) => !arena.isLeagueOnly),
      };
    },
  });
  const sports = optionsQuery.data?.sports ?? [];
  const arenas = optionsQuery.data?.arenas ?? [];

  const availableArenas = arenas.filter(
    (arena) => !sportId || arena.sportIds.includes(sportId),
  );

  const availabilityQuery = useQuery({
    queryKey: queryKeys.availability(userId, arenaId, sportId, date),
    queryFn: () => api.getAvailability(token, arenaId, sportId, date),
    enabled: Boolean(sportId && arenaId && date),
  });
  const slots = availabilityQuery.data?.items ?? [];

  function submit(values: BookingFormValues) {
    setSuccess(false);
    createAppointmentMutation.mutate(values);
  }

  const createAppointmentMutation = useMutation({
    mutationFn: (values: BookingFormValues) =>
      api.createAppointment(token, {
        arenaId: values.arenaId,
        sportId: values.sportId,
        date: values.date,
        scheduleId: values.scheduleId,
        title:
          values.title ||
          `${titlePrefix} ${sports.find((sport) => sport.id === values.sportId)?.name ?? 'esporte'}`,
        description: values.description || undefined,
        holder: true,
        maxPlayers: values.maxPlayers,
      }),
    onSuccess: async (_appointment, values) => {
      setSuccess(true);
      reset({
        ...values,
        title: '',
        description: '',
        maxPlayers: '',
        scheduleId: '',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments', userId] }),
        queryClient.invalidateQueries({ queryKey: ['myAppointments', userId] }),
      ]);
      onCreated();
    },
  });
  const requestError =
    createAppointmentMutation.error ??
    availabilityQuery.error ??
    optionsQuery.error;
  const errorMessage = requestError
    ? requestError instanceof ApiError || requestError instanceof Error
      ? requestError.message
      : 'Não foi possível concluir a solicitação.'
    : null;

  return (
    <Form onSubmit={handleSubmit(submit)} className="booking-form" noValidate>
      {errorMessage && <ErrorState message={errorMessage} />}
      {success && (
        <Alert variant="success">Agendamento criado com sucesso.</Alert>
      )}
      {(optionsQuery.isPending || availabilityQuery.isFetching) && (
        <div className="form-note">Atualizando opções...</div>
      )}
      {!optionsQuery.isPending && arenas.length === 0 && (
        <Alert variant="info">
          Nenhuma arena disponível para este esporte no momento.
        </Alert>
      )}
      <Form.Group className="mb-3">
        <Form.Label htmlFor="booking-sport">Esporte</Form.Label>
        <Form.Select
          id="booking-sport"
          isInvalid={!!errors.sportId}
          {...register('sportId', {
            onChange: () => {
              setValue('arenaId', '');
              setValue('scheduleId', '');
            },
          })}
        >
          <option value="">Selecione uma modalidade</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">
          {errors.sportId?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="booking-arena">Arena</Form.Label>
        <Form.Select
          id="booking-arena"
          isInvalid={!!errors.arenaId}
          {...register('arenaId', {
            onChange: () => {
              setValue('scheduleId', '');
            },
          })}
          disabled={!sportId}
        >
          <option value="">Selecione uma arena</option>
          {availableArenas.map((arena) => (
            <option key={arena.id} value={arena.id}>
              {arena.address}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">
          {errors.arenaId?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <div className="row">
        <Form.Group className="col-md-6 mb-3">
          <Form.Label htmlFor="booking-date">Data</Form.Label>
          <Form.Control
            id="booking-date"
            type="date"
            min={today}
            isInvalid={!!errors.date}
            {...register('date', {
              onChange: () => {
                setValue('scheduleId', '');
              },
            })}
          />
          <Form.Control.Feedback type="invalid">
            {errors.date?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="col-md-6 mb-3">
          <Form.Label htmlFor="booking-schedule">Horário disponível</Form.Label>
          <Form.Select
            id="booking-schedule"
            isInvalid={!!errors.scheduleId}
            {...register('scheduleId')}
            disabled={!slots.length}
          >
            <option value="">
              {slots.length
                ? 'Selecione um horário'
                : 'Sem horários para a seleção'}
            </option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.horary}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.scheduleId?.message}
          </Form.Control.Feedback>
        </Form.Group>
      </div>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="booking-title">Nome do evento</Form.Label>
        <Form.Control
          id="booking-title"
          isInvalid={!!errors.title}
          {...register('title')}
          placeholder={
            titlePrefix.startsWith('Torneio')
              ? 'Ex.: Torneio de vôlei'
              : 'Ex.: Futebol de sábado'
          }
        />
        <Form.Control.Feedback type="invalid">
          {errors.title?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="booking-description">Descrição</Form.Label>
        <Form.Control
          id="booking-description"
          as="textarea"
          rows={3}
          isInvalid={!!errors.description}
          {...register('description')}
          placeholder="Detalhes para quem quiser participar"
        />
        <Form.Control.Feedback type="invalid">
          {errors.description?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-4">
        <Form.Label htmlFor="booking-max-players">
          Limite de participantes (opcional)
        </Form.Label>
        <Form.Control
          id="booking-max-players"
          type="number"
          min={1}
          max={1000}
          isInvalid={!!errors.maxPlayers}
          {...register('maxPlayers')}
        />
        <Form.Control.Feedback type="invalid">
          {errors.maxPlayers?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Button
        type="submit"
        className="w-100"
        disabled={
          isSubmitting ||
          optionsQuery.isPending ||
          availabilityQuery.isFetching ||
          !scheduleId
        }
      >
        {isSubmitting
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
    <Modal show={show} onHide={onHide} centered>
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
