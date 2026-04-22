// ============================================================
// DTO: RegisterUserInput
// Esquema de validación para el registro de usuarios (HU-01 / HU-02 / issue #187).
// ============================================================

import { z } from 'zod';
import {
  DOCUMENT_VALIDATION_RULES,
  isValidDocumentType,
} from '../services/DocumentValidationService';

// Regex que acepta letras (incluyendo acentos/ñ), espacios, apóstrofes y guiones
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const DIGITS_ONLY = /^\d+$/;

/** Enum de tipos de documento soportados (9 tipos, issue #187) */
const DOCUMENT_TYPE_ENUM: [string, ...string[]] = ['CC', 'CE', 'DE', 'PA', 'PE', 'PT', 'RC', 'TI', 'VI'];

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
  documentType: z.enum(DOCUMENT_TYPE_ENUM, {
    message: 'Seleccione un tipo de documento válido',
  }),
  documentNumber: z
    .string()
    .trim()
    .min(5, 'El documento debe tener al menos 5 caracteres')
    .max(20, 'El documento no puede exceder 20 caracteres'),
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
})
  // Validación cruzada: documentNumber debe cumplir las reglas según documentType (issue #187)
  .refine(
    (data) => {
      if (!data.documentType || !isValidDocumentType(data.documentType)) return false;
      const rule = DOCUMENT_VALIDATION_RULES[data.documentType];
      if (!rule) return false;
      return rule.pattern.test(data.documentNumber);
    },
    {
      message: 'El formato del documento no es válido para el tipo seleccionado',
      path: ['documentNumber'],
    }
  );

/** Esquema a nivel de request para el middleware validateRequest (HU-53) */
export const RegisterUserInputSchema = z.object({
  body: RegisterUserSchema,
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
