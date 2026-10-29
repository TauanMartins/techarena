import { z } from 'zod';

function localDateInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dateOnlySchema = z.iso.date({ error: 'Informe uma data válida.' });

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe seu nome.')
    .max(150, { error: 'O nome deve ter no máximo 150 caracteres.' }),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.')
    .max(45, 'O nome de usuário deve ter no máximo 45 caracteres.')
    .regex(
      /^[a-z0-9_]+$/,
      'Use apenas letras minúsculas, números e sublinhado.',
    ),
  birthDate: dateOnlySchema
    .refine((value) => value <= localDateInputValue(), {
      message: 'A data de nascimento não pode estar no futuro.',
    }),
  gender: z.enum(['', 'M', 'F', 'O']),
});

export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;

export const teamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da equipe.')
    .max(45, { error: 'O nome da equipe deve ter no máximo 45 caracteres.' }),
  description: z
    .string()
    .trim()
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres.')
    .transform((value) => value || undefined),
});

export type TeamFormInput = z.input<typeof teamFormSchema>;
export type TeamFormValues = z.output<typeof teamFormSchema>;

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

const leagueSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da liga.')
    .max(45, { error: 'O nome da liga deve ter no máximo 45 caracteres.' }),
  description: z
    .string()
    .trim()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .transform((value) => value || undefined),
  tournamentFormat: z.enum([
    'round_robin',
    'knockout',
    'groups_knockout',
  ]),
  groupCount: z.coerce
    .number()
    .int('O número de grupos deve ser inteiro.')
    .min(2, 'A liga precisa ter pelo menos 2 grupos.')
    .max(16, 'A liga pode ter no máximo 16 grupos.'),
  qualifiersPerGroup: z.coerce
    .number()
    .int('O número de classificados deve ser inteiro.')
    .min(1, 'Deve haver pelo menos 1 classificado por grupo.')
    .max(8, 'Pode haver no máximo 8 classificados por grupo.'),
});

export const leagueCreateFormSchema = leagueSettingsSchema.extend({
  sportId: z.string().min(1, 'Selecione uma modalidade.'),
});

export const leagueUpdateFormSchema = leagueSettingsSchema;

export const leagueScoreSchema = z.object({
  homeScore: z
    .string()
    .regex(/^\d+$/, 'Informe um placar inteiro e não negativo.')
    .transform(Number),
  awayScore: z
    .string()
    .regex(/^\d+$/, 'Informe um placar inteiro e não negativo.')
    .transform(Number),
});
