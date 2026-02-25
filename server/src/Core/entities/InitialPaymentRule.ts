// Dominio: Regla de cuota inicial.
// Mínimo 20% del valor neto de la matrícula.

import { Money } from './Money';

export class InitialPaymentRule {
  private static readonly MIN_PCT = 20;

  // Valida que el porcentaje sea >= 20%
  static validatePct(pct: number): void {
    if (pct < InitialPaymentRule.MIN_PCT) {
      throw new Error(
        `La cuota inicial debe ser al menos ${InitialPaymentRule.MIN_PCT}% del valor neto de matrícula.`,
      );
    }
  }

  // Calcula el valor COP de la cuota inicial dado un porcentaje
  static computeValue(netTuition: Money, pct: number): Money {
    InitialPaymentRule.validatePct(pct);
    return netTuition.multiplyByRate(pct / 100);
  }

  get minPct(): number {
    return InitialPaymentRule.MIN_PCT;
  }
}
