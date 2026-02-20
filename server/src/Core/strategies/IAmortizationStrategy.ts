// ============================================================
// Strategy Pattern: IAmortizationStrategy
// Interfaz para los distintos métodos de cálculo financiero.
// Permite intercambiar algoritmos sin modificar el código
// que los consume (Open/Closed Principle).
// ============================================================

import { AmortizationRow } from '../entities/Credit';

export interface AmortizationInput {
  amount: number;       // Capital / monto del crédito
  annualRate: number;   // Tasa anual (ej: 0.12)
  termMonths: number;   // Plazo en meses
}

export interface AmortizationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationRow[];
}

export interface IAmortizationStrategy {
  calculate(input: AmortizationInput): AmortizationResult;
  readonly name: string;
}
