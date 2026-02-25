// Dominio: Regla de cuota inicial.
// Mínimo dinámico según nivel de formación:
//   upbTech   → 15%
//   pregrado / posgrado → 20%

import { Money } from './Money';
import type { EducationLevel } from './ModalityRule';

export class InitialPaymentRule {
  private static readonly MIN_PCT_DEFAULT  = 20;
  private static readonly MIN_PCT_UPB_TECH = 15;

  // Retorna el porcentaje mínimo según el nivel de formación
  static minPctFor(educationLevel: EducationLevel): number {
    return educationLevel === 'upbTech'
      ? InitialPaymentRule.MIN_PCT_UPB_TECH
      : InitialPaymentRule.MIN_PCT_DEFAULT;
  }

  // Valida que el porcentaje sea >= mínimo del nivel de formación
  static validatePct(pct: number, educationLevel: EducationLevel): void {
    const min = InitialPaymentRule.minPctFor(educationLevel);
    if (pct < min) {
      throw new Error(
        `La cuota inicial debe ser al menos ${min}% del valor neto de matrícula para ${educationLevel}.`,
      );
    }
  }

  // Calcula el valor COP de la cuota inicial dado un porcentaje
  static computeValue(netTuition: Money, pct: number, educationLevel: EducationLevel): Money {
    InitialPaymentRule.validatePct(pct, educationLevel);
    return netTuition.multiplyByRate(pct / 100);
  }
}
