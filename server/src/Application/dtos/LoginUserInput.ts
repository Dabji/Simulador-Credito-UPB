// ============================================================
// DTO: LoginUserInput
// Esquema Zod para validar el payload de login (HU-02).
// ============================================================

import { z } from 'zod';

export const LoginUserSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  role: z.enum(['STUDENT', 'ADMIN'], {
    message: 'El rol debe ser STUDENT o ADMIN',
  }),
});

export type LoginUserInput = z.infer<typeof LoginUserSchema>;
