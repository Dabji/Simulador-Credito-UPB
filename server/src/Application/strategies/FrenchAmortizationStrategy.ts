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
    if (!dbLevel) {
      throw new Error('No se puede calcular: nivel educativo no reconocido.');
    }

    // HU-PV-02: Buscar tasa desde levelConfigs por paymentCount
    const cfgs = activeVersion.levelConfigs.filter(c => c.levelScope === dbLevel);
    if (cfgs.length > 0) {
      const cfg = cfgs.find(c => c.paymentCount === input.numberOfPayments);
      if (cfg) return cfg.rateMonthly;
      return 0;
    }

    // Fallback: usar interestRates (comportamiento original)
    const rateEntry = activeVersion.interestRates.find(r => r.levelScope === dbLevel);
    if (rateEntry?.rateMonthly == null) {
      throw new Error(
        'No se puede calcular: la versión de parámetros activa no define una tasa de interés para este nivel.',
      );
    }

    return rateEntry.rateMonthly;
  }

  computePeriodicPayment(principal: number, rate: number, installments: number): number {
    if (principal <= 0 || installments <= 0) return 0;
    if (Math.abs(rate) < 1e-10) return principal / installments;
    const factor = Math.pow(1 + rate, installments);
    return (principal * rate * factor) / (factor - 1);
  }
}
