// ============================================================
// DTO: ResetPasswordInput
// Esquema Zod para validar token + nueva contraseña.
// ============================================================

import { z } from 'zod';

export const ResetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'El token es requerido'),
    password: z
      .string()
      .min(7, 'La contraseña debe tener al menos 7 caracteres')
      .max(11, 'La contraseña debe tener máximo 11 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        'La contraseña debe contener al menos 1 mayúscula, 1 minúscula y 1 número',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/** Esquema a nivel de request para el middleware validateRequest (HU-53) */
export const ResetPasswordInputSchema = z.object({
  body: ResetPasswordSchema,
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
