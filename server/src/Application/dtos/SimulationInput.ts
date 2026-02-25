// DTO: Datos de entrada del formulario para calcular una simulación (HU-13).
// Viaja del frontend al endpoint POST /api/simulator/preview.

import type { InterestMode } from '../../Core/entities/InterestRate';
import type { StudentType, EducationLevel } from '../../Core/entities/ModalityRule';

export interface SimulationInput {
  readonly studentType: StudentType;
  readonly educationLevel: EducationLevel;
  readonly tuitionGross: number;        // COP, entero
  readonly scholarshipPct: number;      // 0-100
  readonly initialPaymentPct: number;   // mínimo 20
  readonly initialPaymentValue: number; // COP (calculado en frontend, validado en backend)
  readonly interestMode: InterestMode;
  readonly academicPeriod: string;      // "YYYY-01" | "YYYY-02"
  readonly firstPaymentMonth: number;   // 1-12
  readonly numberOfPayments: number;    // entero >= 1
  readonly observations: string;
  readonly starred: boolean;
}
