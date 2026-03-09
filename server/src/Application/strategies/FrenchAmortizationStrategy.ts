// ============================================================
// Strategy: Con Interés — Sistema Francés (cuota fija)
// M = P × r × (1+r)^n / ((1+r)^n − 1)
// ============================================================

import type { InterestStrategy } from './InterestStrategy';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { ActiveParameterVersion } from '../../Core/repositories/IParameterVersionRepository';
import { LEVEL_MAP } from '../dtos/constants';

export class FrenchAmortizationStrategy implements InterestStrategy {
  resolveMonthlyRate(input: SimulationInput, activeVersion?: ActiveParameterVersion): number {
    if (!activeVersion) {
      throw new Error(
        'No se puede calcular: se requiere la versión de parámetros activa para resolver la tasa de interés.',
      );
    }

    const dbLevel = LEVEL_MAP[input.educationLevel];
    const rateEntry = dbLevel
      ? activeVersion.interestRates.find(r => r.levelScope === dbLevel)
      : undefined;

    if (rateEntry?.rateMonthly == null) {
      throw new Error(
        'No se puede calcular: la versión de parámetros activa no define una tasa de interés para este nivel.',
      );
    }

    return rateEntry.rateMonthly;
  }

  computePeriodicPayment(principal: number, rate: number, installments: number): number {
    if (principal <= 0 || installments <= 0) return 0;
    const factor = Math.pow(1 + rate, installments);
    return (principal * rate * factor) / (factor - 1);
  }
}
