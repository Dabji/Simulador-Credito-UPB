// DTO: Resumen calculado de una simulación (HU-13).
// Viaja del backend al frontend como respuesta del endpoint preview.

import type { InterestMode } from '../../Core/entities/InterestRate';

// Fila de la tabla de amortización serializada para JSON
export interface AmortizationRowDTO {
  readonly period: number;
  readonly date: string;         // "YYYY-MM-DD"
  readonly initialBalance: number;
  readonly principal: number;
  readonly interest: number;
  readonly payment: number;
  readonly finalBalance: number;
}

export interface SimulationSummary {
  readonly id: string;
  readonly tuitionGross: number;
  readonly scholarshipPct: number;
  readonly tuitionNet: number;
  readonly initialPayment: number;
  readonly initialPaymentPct: number;
  readonly financedValue: number;
  readonly interestMode: InterestMode;
  readonly academicPeriod: string;
  readonly firstPaymentMonth: number;
  readonly numberOfPayments: number;
  readonly periodicPayment: number;
  readonly totalPaid: number;
  readonly totalInterest: number;
  readonly schedule: AmortizationRowDTO[];
}
