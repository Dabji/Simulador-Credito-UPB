// ============================================================
// DTO: RegisterUserInput
// Esquema de validación para el registro de usuarios (HU-01 / HU-02).
// ============================================================

import { z } from 'zod';

// Regex que acepta letras (incluyendo acentos/ñ), espacios, apóstrofes y guiones
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const DIGITS_ONLY = /^\d+$/;

export const RegisterUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(NAME_REGEX, 'El nombre solo puede contener letras, espacios, guiones y apóstrofes'),
  lastName: z
    .string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(NAME_REGEX, 'El apellido solo puede contener letras, espacios, guiones y apóstrofes'),
  documentType: z.enum(['CC', 'TI'], {
    message: 'El tipo de documento debe ser CC o TI',
  }),
  documentNumber: z
    .string()
    .trim()
    .regex(DIGITS_ONLY, 'El número de documento solo puede contener dígitos')
    .min(5, 'El número de documento debe tener al menos 5 dígitos')
    .max(20, 'El número de documento no puede exceder 20 dígitos'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('El correo electrónico no es válido')
    .max(255, 'El correo electrónico no puede exceder 255 caracteres'),
  phone: z
    .string()
    .trim()
    .regex(DIGITS_ONLY, 'El teléfono solo puede contener dígitos')
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(15, 'El teléfono no puede exceder 15 dígitos'),
  password: z
    .string()
    .min(7, 'La contraseña debe tener al menos 7 caracteres')
    .max(11, 'La contraseña debe tener máximo 11 caracteres')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/\d/, 'La contraseña debe contener al menos un número'),
  termsAccepted: z.literal(true, {
    message: 'Debe aceptar los términos y condiciones',
  }),
});

/** Esquema a nivel de request para el middleware validateRequest (HU-53) */
export const RegisterUserInputSchema = z.object({
  body: RegisterUserSchema,
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
