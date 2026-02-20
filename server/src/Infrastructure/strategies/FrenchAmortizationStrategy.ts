// ============================================================
// Strategy: FrenchAmortizationStrategy
// Implementa el sistema francés de amortización (cuota fija).
// Fórmula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
// ============================================================

import type { AmortizationRow } from '../../Core/entities/Credit';
import type {
  IAmortizationStrategy,
  AmortizationInput,
  AmortizationResult,
} from '../../Core/strategies/IAmortizationStrategy';

export class FrenchAmortizationStrategy implements IAmortizationStrategy {
  readonly name = 'FRENCH';

  calculate(input: AmortizationInput): AmortizationResult {
    const { amount, annualRate, termMonths } = input;

    // Tasa de interés mensual
    const monthlyRate = annualRate / 12;

    // Cuota fija mensual (Sistema Francés)
    const monthlyPayment =
      (amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    // Generar tabla de amortización
    const schedule: AmortizationRow[] = [];
    let balance = amount;
    let totalInterest = 0;

    for (let period = 1; period <= termMonths; period++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      balance = Math.max(balance - principal, 0);
      totalInterest += interest;

      schedule.push({
        period,
        payment: this.round(monthlyPayment),
        interest: this.round(interest),
        principal: this.round(principal),
        balance: this.round(balance),
      });
    }

    return {
      monthlyPayment: this.round(monthlyPayment),
      totalInterest: this.round(totalInterest),
      totalPayment: this.round(monthlyPayment * termMonths),
      schedule,
    };
  }

  private round(value: number, decimals = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
