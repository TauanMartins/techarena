import { z } from "zod";

export const teamFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da equipe.").max(45, { error: "O nome da equipe deve ter no máximo 45 caracteres." }),
  description: z.string().trim().max(2000, "A descrição deve ter no máximo 2000 caracteres.").transform((value) => value || undefined),
});

export type TeamFormInput = z.input<typeof teamFormSchema>;
export type TeamFormValues = z.output<typeof teamFormSchema>;
