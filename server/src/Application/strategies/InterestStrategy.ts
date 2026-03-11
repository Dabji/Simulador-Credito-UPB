// ============================================================
// Strategy: Cálculo de tasa e interés para simulaciones.
// Abstrae la lógica de cálculo de cuota periódica para que
// SimulationEngine no necesite condicionales if/switch por
// modalidad de interés (sin_interes vs con_interes).
// ============================================================

import type { SimulationInput } from '../dtos/SimulationInput';
import type { ActiveParameterVersion } from '../../Core/repositories/IParameterVersionRepository';

/**
 * Contrato que define cómo se calcula la tasa mensual y la cuota periódica
 * según la modalidad de crédito.
 */
export interface InterestStrategy {
  /** Retorna la tasa mensual efectiva (0 para sin interés) */
  resolveMonthlyRate(input: SimulationInput, activeVersion?: ActiveParameterVersion): number;

  /** Calcula la cuota periódica fija dado el principal, tasa y número de cuotas */
  computePeriodicPayment(principal: number, rate: number, installments: number): number;
}
