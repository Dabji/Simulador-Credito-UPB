// DTO: UpdateMyProfileInput (HU-81)
// Solo se permiten actualizar los campos listados explícitamente.
// El userId NUNCA viene del body — se toma siempre del JWT en el use case.

import { z } from 'zod';

export const UpdateMyProfileSchema = z.object({
  documentType: z
    .enum(['CC', 'TI'], { message: 'Tipo de documento inválido. Debe ser CC o TI.' })
    .optional(),
  identificationNumber: z
    .string()
    .min(5, 'El número de documento debe tener al menos 5 caracteres.')
    .max(20, 'El número de documento no puede superar 20 caracteres.')
    .optional(),
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(60, 'El nombre no puede superar 60 caracteres.')
    .optional(),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres.')
    .max(60, 'El apellido no puede superar 60 caracteres.')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Número celular inválido.')
    .optional(),
});

export type UpdateMyProfileInput = z.infer<typeof UpdateMyProfileSchema>;
