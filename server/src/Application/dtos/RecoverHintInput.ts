// ============================================================
// DTO: RecoverHintInput (HU-PV-04)
// Valida el número de identificación para obtener pista de correo.
// ============================================================

import { z } from 'zod';

export const RecoverHintSchema = z.object({
  identificationNumber: z
    .string()
    .trim()
    .min(5, 'El número de identificación debe tener al menos 5 caracteres')
    .max(20, 'El número de identificación no puede exceder 20 caracteres')
    .regex(/^\d+$/, 'El número de identificación solo debe contener dígitos'),
});

export const RecoverHintInputSchema = z.object({
  body: RecoverHintSchema,
});

export type RecoverHintInput = z.infer<typeof RecoverHintSchema>;
