import { z } from 'zod';

function localDateInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dateOnlySchema = z.iso.date({ error: 'Informe uma data válida.' });
const optionalPlayerLimitSchema = z
  .string()
  .transform((value) => (value.trim() ? Number(value) : undefined))
  .pipe(
    z
      .number()
      .int('O limite deve ser um número inteiro.')
      .min(1, 'O limite mínimo é 1 participante.')
      .max(1000, 'O limite máximo é 1000 participantes.')
      .optional(),
  );

export const bookingFormSchema = z.object({
  sportId: z.string().min(1, 'Selecione uma modalidade.'),
  arenaId: z.string().min(1, 'Selecione uma arena.'),
  scheduleId: z.string().min(1, 'Selecione um horário.'),
  date: dateOnlySchema.refine((value) => value >= localDateInputValue(), {
    message: 'A data deve ser hoje ou uma data futura.',
  }),
  title: z
    .string()
    .trim()
    .max(100, 'O nome do evento deve ter no máximo 100 caracteres.'),
  description: z
    .string()
    .trim()
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres.'),
  maxPlayers: optionalPlayerLimitSchema,
});

export type BookingFormInput = z.input<typeof bookingFormSchema>;
export type BookingFormValues = z.output<typeof bookingFormSchema>;
