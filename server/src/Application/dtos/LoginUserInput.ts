// ============================================================
// DTO: LoginUserInput
// Esquema Zod para validar el payload de login (HU-02).
// ============================================================

import { z } from 'zod';

export const LoginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('El correo electrónico no es válido')
    .max(255, 'El correo electrónico no puede exceder 255 caracteres'),
  password: z.string().min(1, 'La contraseña es requerida'),
  role: z.enum(['STUDENT', 'ADMIN'], {
    message: 'El rol debe ser STUDENT o ADMIN',
  }),
});

/** Esquema a nivel de request para el middleware validateRequest (HU-53) */
export const LoginUserInputSchema = z.object({
  body: LoginUserSchema,
});

export type LoginUserInput = z.infer<typeof LoginUserSchema>;
