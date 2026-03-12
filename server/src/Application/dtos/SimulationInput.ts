// ============================================================
// DTO: SimulationInput
// Esquema Zod para validar datos de entrada del simulador (HU-13).
// Viaja del frontend al endpoint POST /api/simulator/preview.
// ============================================================

import { z } from 'zod';

const ACADEMIC_PERIOD_REGEX = /^\d{4}-(01|02)$/;

export const SimulationInputSchema = z
  .object({
    studentType: z.enum(['nuevo', 'continuo'], {
      message: 'El tipo de estudiante debe ser "nuevo" o "continuo"',
    }),
    educationLevel: z.enum(['pregrado', 'posgrado', 'upbTech'], {
      message: 'El nivel educativo debe ser "pregrado", "posgrado" o "upbTech"',
    }),
    tuitionGross: z
      .number({ message: 'El valor de matrícula debe ser un número' })
      .int('El valor de matrícula debe ser un entero')
      .positive('El valor de matrícula debe ser positivo'),
    scholarshipPct: z
      .number({ message: 'El porcentaje de beca debe ser un número' })
      .min(0, 'El porcentaje de beca no puede ser negativo')
      .max(100, 'El porcentaje de beca no puede exceder 100'),
    initialPaymentPct: z
      .number({ message: 'El porcentaje de cuota inicial debe ser un número' })
      .min(15, 'El porcentaje de cuota inicial mínimo es 15%')
      .max(100, 'El porcentaje de cuota inicial no puede exceder 100%'),
    initialPaymentValue: z
      .number({ message: 'El valor de cuota inicial debe ser un número' })
      .int('El valor de cuota inicial debe ser un entero')
      .nonnegative('El valor de cuota inicial no puede ser negativo'),
    interestMode: z.enum(['sin_interes', 'con_interes'], {
      message: 'El modo de interés debe ser "sin_interes" o "con_interes"',
    }),
    academicPeriod: z
      .string()
      .regex(ACADEMIC_PERIOD_REGEX, 'El periodo académico debe tener formato YYYY-01 o YYYY-02'),
    firstPaymentMonth: z
      .number({ message: 'El mes de primer pago debe ser un número' })
      .int('El mes de primer pago debe ser un entero')
      .min(1, 'El mes de primer pago debe estar entre 1 y 12')
      .max(12, 'El mes de primer pago debe estar entre 1 y 12'),
    numberOfPayments: z
      .number({ message: 'El número de cuotas debe ser un número' })
      .int('El número de cuotas debe ser un entero')
      .min(1, 'Debe haber al menos 1 cuota')
      .max(12, 'El número máximo de cuotas es 12'),
    observations: z.string().max(500, 'Las observaciones no pueden exceder 500 caracteres').default(''),
    starred: z.boolean().default(false),
  })
  .superRefine((input, ctx) => {
    if (input.educationLevel !== 'upbTech' && input.initialPaymentPct < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para pregrado y posgrado el porcentaje de cuota inicial mínimo es 20%',
        path: ['initialPaymentPct'],
      });
    }
  });

export type SimulationInput = z.infer<typeof SimulationInputSchema>;
