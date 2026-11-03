import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../auth/useAuth";
import { ApiError } from "../../../shared/api";
import { bookingFormSchema, type BookingFormInput, type BookingFormValues } from "../schemas/booking.schema";
import { useAppointmentAvailability, useBookingOptions, useCreateAppointment } from "../api/appointments.api";
import { ErrorState } from "../../../components/Feedback";
import { BookingFields } from "./BookingFields";

function dateInputToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function BookingForm({ titlePrefix = "Partida de", onCreated }: { titlePrefix?: string; onCreated: () => void }) {
  const { session } = useAuth();
  const token = session!.access_token;
  const userId = session!.user.id;
  const today = useMemo(dateInputToday, []);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<BookingFormInput, undefined, BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { sportId: "", arenaId: "", scheduleId: "", date: today, title: "", description: "", maxPlayers: "" },
  });
  const sportId = watch("sportId");
  const arenaId = watch("arenaId");
  const date = watch("date");
  const scheduleId = watch("scheduleId");
  const [success, setSuccess] = useState(false);
  const optionsQuery = useBookingOptions(token, userId);
  const availabilityQuery = useAppointmentAvailability(token, userId, arenaId, sportId, date);
  const createMutation = useCreateAppointment(token, userId);
  const sports = optionsQuery.data?.sports ?? [];
  const arenas = optionsQuery.data?.arenas ?? [];
  const availableArenas = arenas.filter((arena) => !sportId || arena.sportIds.includes(sportId));
  const slots = availabilityQuery.data?.items ?? [];

  function submit(values: BookingFormValues) {
    setSuccess(false);
    createMutation.mutate({ arenaId: values.arenaId, sportId: values.sportId, date: values.date, scheduleId: values.scheduleId,
      title: values.title || `${titlePrefix} ${sports.find((sport) => sport.id === values.sportId)?.name ?? "esporte"}`,
      description: values.description || undefined, holder: true, maxPlayers: values.maxPlayers,
    }, { onSuccess: () => { setSuccess(true); reset({ ...values, title: "", description: "", maxPlayers: "", scheduleId: "" }); onCreated(); } });
  }
  const cause = createMutation.error ?? availabilityQuery.error ?? optionsQuery.error;
  const errorMessage = cause ? cause instanceof ApiError || cause instanceof Error ? cause.message : "Não foi possível concluir a solicitação." : null;

  return <Form onSubmit={handleSubmit(submit)} className="booking-form" noValidate>
    {errorMessage && <ErrorState message={errorMessage} />}
    {success && <Alert variant="success">Agendamento criado com sucesso.</Alert>}
    {(optionsQuery.isPending || availabilityQuery.isFetching) && <div className="form-note">Atualizando opções...</div>}
    {!optionsQuery.isPending && arenas.length === 0 && <Alert variant="info">Nenhuma arena disponível para este esporte no momento.</Alert>}
    <BookingFields sports={sports} availableArenas={availableArenas} slots={slots} sportId={sportId} today={today} titlePrefix={titlePrefix} register={register} setValue={setValue} errors={errors} />
    <Button type="submit" className="w-100" disabled={isSubmitting || createMutation.isPending || optionsQuery.isPending || availabilityQuery.isFetching || !scheduleId}>{isSubmitting || createMutation.isPending ? "Salvando..." : titlePrefix.startsWith("Torneio") ? "Criar evento de liga" : "Publicar agendamento"}</Button>
  </Form>;
}

export function BookingModal({ show, onHide, onCreated }: { show: boolean; onHide: () => void; onCreated: () => void }) {
  return <Modal show={show} onHide={onHide} centered><Modal.Header closeButton><Modal.Title>Novo agendamento</Modal.Title></Modal.Header><Modal.Body><BookingForm onCreated={() => { onCreated(); onHide(); }} /></Modal.Body></Modal>;
}
