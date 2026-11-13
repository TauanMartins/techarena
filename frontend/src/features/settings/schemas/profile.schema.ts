import { z } from 'zod';

function localDateInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  birthDate: z.iso
    .date({ error: 'Informe uma data válida.' })
    .refine((value) => value <= localDateInputValue(), {
      message: 'A data de nascimento não pode estar no futuro.',
    }),
  gender: z.enum(['', 'M', 'F', 'O']),
});

export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;
