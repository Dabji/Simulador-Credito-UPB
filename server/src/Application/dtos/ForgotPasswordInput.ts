// ============================================================
// DTO: ForgotPasswordInput
// Esquema Zod para validar el email de recuperación.
// ============================================================

import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
