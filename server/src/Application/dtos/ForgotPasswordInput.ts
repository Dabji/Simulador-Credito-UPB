// ============================================================
// DTO: ForgotPasswordInput
// Esquema Zod para validar el email de recuperación.
// ============================================================

import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('El correo electrónico no es válido')
    .max(255, 'El correo electrónico no puede exceder 255 caracteres'),
});

/** Esquema a nivel de request para el middleware validateRequest (HU-53) */
export const ForgotPasswordInputSchema = z.object({
  body: ForgotPasswordSchema,
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
