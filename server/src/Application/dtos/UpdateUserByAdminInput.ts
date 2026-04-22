// DTO: UpdateUserByAdminInput (HU-82)
// Campos que el admin puede actualizar en el perfil de otro usuario.
// Role, password y createdAt NO son editables. Email SÍ es editable por el admin.

import { z } from 'zod';

export const UpdateUserByAdminSchema = z.object({
  email: z
    .string()
    .trim()
    .email('El correo electrónico no es válido.')
    .max(100, 'El correo no puede superar 100 caracteres.')
    .optional(),
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

export const UpdateUserByAdminInputSchema = z.object({
  body: UpdateUserByAdminSchema,
});

export type UpdateUserByAdminInput = z.infer<typeof UpdateUserByAdminSchema>;
