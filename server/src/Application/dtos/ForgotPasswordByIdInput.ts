// ============================================================
// DTO: ForgotPasswordByIdInput (HU-PV-04)
// Valida el número de identificación para iniciar recuperación
// de contraseña sin conocer el correo asociado.
// ============================================================

import { z } from 'zod';

export const ForgotPasswordByIdSchema = z.object({
  identificationNumber: z
    .string()
    .min(5, 'El número de identificación debe tener al menos 5 caracteres')
    .max(20, 'El número de identificación no puede exceder 20 caracteres')
    .regex(/^\d+$/, 'El número de identificación solo debe contener dígitos'),
});

export const ForgotPasswordByIdInputSchema = z.object({
  body: ForgotPasswordByIdSchema,
});

export type ForgotPasswordByIdInput = z.infer<typeof ForgotPasswordByIdSchema>;
