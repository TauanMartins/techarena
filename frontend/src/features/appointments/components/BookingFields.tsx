import Form from "react-bootstrap/Form";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { Arena, Schedule, Sport } from "../types/appointments.types";
import type { BookingFormInput } from "../schemas/booking.schema";

export function BookingFields({ sports, availableArenas, slots, sportId, today, titlePrefix, register, setValue, errors }: {
  sports: Sport[]; availableArenas: Arena[]; slots: Schedule[]; sportId: string; today: string;
  titlePrefix: string;
  register: UseFormRegister<BookingFormInput>; setValue: UseFormSetValue<BookingFormInput>; errors: FieldErrors<BookingFormInput>;
}) {
  return <>
    <Form.Group className="mb-3"><Form.Label htmlFor="booking-sport">Esporte</Form.Label><Form.Select id="booking-sport" isInvalid={!!errors.sportId} {...register("sportId", { onChange: () => { setValue("arenaId", ""); setValue("scheduleId", ""); } })}><option value="">Selecione uma modalidade</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{errors.sportId?.message}</Form.Control.Feedback></Form.Group>
    <Form.Group className="mb-3"><Form.Label htmlFor="booking-arena">Arena</Form.Label><Form.Select id="booking-arena" isInvalid={!!errors.arenaId} {...register("arenaId", { onChange: () => setValue("scheduleId", "") })} disabled={!sportId}><option value="">Selecione uma arena</option>{availableArenas.map((arena) => <option key={arena.id} value={arena.id}>{arena.address}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{errors.arenaId?.message}</Form.Control.Feedback></Form.Group>
    <div className="row"><Form.Group className="col-md-6 mb-3"><Form.Label htmlFor="booking-date">Data</Form.Label><Form.Control id="booking-date" type="date" min={today} isInvalid={!!errors.date} {...register("date", { onChange: () => setValue("scheduleId", "") })} /><Form.Control.Feedback type="invalid">{errors.date?.message}</Form.Control.Feedback></Form.Group>
      <Form.Group className="col-md-6 mb-3"><Form.Label htmlFor="booking-schedule">Horário disponível</Form.Label><Form.Select id="booking-schedule" isInvalid={!!errors.scheduleId} {...register("scheduleId")} disabled={!slots.length}><option value="">{slots.length ? "Selecione um horário" : "Sem horários para a seleção"}</option>{slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.horary}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{errors.scheduleId?.message}</Form.Control.Feedback></Form.Group></div>
    <Form.Group className="mb-3"><Form.Label htmlFor="booking-title">Nome do evento</Form.Label><Form.Control id="booking-title" isInvalid={!!errors.title} {...register("title")} placeholder={titlePrefix.startsWith("Torneio") ? "Ex.: Torneio de vôlei" : "Ex.: Futebol de sábado"} /><Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback></Form.Group>
    <Form.Group className="mb-3"><Form.Label htmlFor="booking-description">Descrição</Form.Label><Form.Control id="booking-description" as="textarea" rows={3} isInvalid={!!errors.description} {...register("description")} placeholder="Detalhes para quem quiser participar" /><Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback></Form.Group>
    <Form.Group className="mb-4"><Form.Label htmlFor="booking-max-players">Limite de participantes (opcional)</Form.Label><Form.Control id="booking-max-players" type="number" min={1} max={1000} isInvalid={!!errors.maxPlayers} {...register("maxPlayers")} /><Form.Control.Feedback type="invalid">{errors.maxPlayers?.message}</Form.Control.Feedback></Form.Group>
  </>;
}
