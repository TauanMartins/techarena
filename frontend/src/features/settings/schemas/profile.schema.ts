import { z } from 'zod';

function isAdult(value: string) {
  const now = new Date();
  const birth = new Date(`${value}T00:00:00.000Z`);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() &&
      now.getUTCDate() < birth.getUTCDate())
  )
    age--;
  return age >= 18;
}

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
  birthDate: z.iso.date({ error: 'Informe uma data válida.' }).refine(isAdult, {
    message: 'Você precisa ter pelo menos 18 anos.',
  }),
  gender: z.enum(['', 'M', 'F', 'O']),
});

export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;
