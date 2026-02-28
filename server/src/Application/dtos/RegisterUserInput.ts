// ============================================================
// DTO: RegisterUserInput
// Esquema de validación para el registro de usuarios (HU-01).
// ============================================================

import { z } from 'zod';

export const RegisterUserSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres'),
  documentType: z.enum(['CC', 'TI'], {
    message: 'El tipo de documento debe ser CC o TI',
  }),
  documentNumber: z
    .string()
    .min(5, 'El número de documento debe tener al menos 5 caracteres'),
  email: z
    .string()
    .email('El correo electrónico no es válido'),
  phone: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 caracteres'),
  password: z
    .string()
    .min(7, 'La contraseña debe tener al menos 7 caracteres')
    .max(11, 'La contraseña debe tener máximo 11 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      'La contraseña debe contener al menos 1 mayúscula, 1 minúscula y 1 número',
    ),
  termsAccepted: z.literal(true, {
    message: 'Debe aceptar los términos y condiciones',
  }),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
