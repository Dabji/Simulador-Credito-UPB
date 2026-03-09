// ============================================================
// Strategy: Sin Interés — Cuota lineal (P / n)
// ============================================================

import type { InterestStrategy } from './InterestStrategy';
import type { SimulationInput } from '../dtos/SimulationInput';

export class NoInterestStrategy implements InterestStrategy {
  resolveMonthlyRate(_input: SimulationInput): number {
    return 0;
  }

  computePeriodicPayment(principal: number, _rate: number, installments: number): number {
    if (principal <= 0 || installments <= 0) return 0;
    return principal / installments;
  }
}
