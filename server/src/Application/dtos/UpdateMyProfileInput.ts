// DTO: UpdateMyProfileInput (HU-81)
// Solo se permiten actualizar los campos listados explícitamente.
// El userId NUNCA viene del body — se toma siempre del JWT en el use case.

import { z } from 'zod';

export const UpdateMyProfileSchema = z.object({
  documentType: z
    .enum(['CC', 'CE', 'DE', 'PA', 'PE', 'PT', 'RC', 'TI', 'VI'], { message: 'Tipo de documento inválido. Debe ser uno de: CC, CE, DE, PA, PE, PT, RC, TI, VI.' })
    .optional(),
  identificationNumber: z
    .string()
    .trim()
    .min(5, 'El número de documento debe tener al menos 5 caracteres.')
    .max(20, 'El número de documento no puede superar 20 caracteres.')
    .optional(),
  firstName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(60, 'El nombre no puede superar 60 caracteres.')
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres.')
    .max(60, 'El apellido no puede superar 60 caracteres.')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, 'Número celular inválido.')
    .optional(),
});

/** Esquema a nivel de request para el middleware validateRequest (HU-53) */
export const UpdateMyProfileInputSchema = z.object({
  body: UpdateMyProfileSchema,
});

export type UpdateMyProfileInput = z.infer<typeof UpdateMyProfileSchema>;
