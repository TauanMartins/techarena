import { z } from 'zod';

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
  tournamentFormat: z.enum(['round_robin', 'knockout', 'groups_knockout']),
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

export type LeagueCreateFormInput = z.input<typeof leagueCreateFormSchema>;
export type LeagueCreateFormValues = z.output<typeof leagueCreateFormSchema>;
export type LeagueUpdateFormInput = z.input<typeof leagueUpdateFormSchema>;
export type LeagueUpdateFormValues = z.output<typeof leagueUpdateFormSchema>;
export type LeagueScoreInput = z.input<typeof leagueScoreSchema>;
export type LeagueScoreValues = z.output<typeof leagueScoreSchema>;
