// ============================================================
// Use Case: SimulateCredit
// Orquesta la simulación de un crédito educativo usando
// el Strategy Pattern para el cálculo de amortización.
// ============================================================

import { Credit, AmortizationType } from '../../Core/entities/Credit';
import type { AmortizationRow } from '../../Core/entities/Credit';
import type { ICreditRepository } from '../../Core/repositories/ICreditRepository';
import type {
  IAmortizationStrategy,
  AmortizationResult,
} from '../../Core/strategies/IAmortizationStrategy';
import { BadRequestError } from '../../Core/errors';

export interface SimulateCreditInput {
  userId: string;
  amount: number;
  annualRate: number;
  termMonths: number;
  amortizationType: AmortizationType;
}

export interface SimulateCreditOutput {
  credit: Credit;
  schedule: AmortizationRow[];
}

export class SimulateCreditUseCase {
  constructor(
    private readonly creditRepository: ICreditRepository,
    private readonly strategies: Map<AmortizationType, IAmortizationStrategy>,
  ) {}

  async execute(input: SimulateCreditInput): Promise<SimulateCreditOutput> {
    // 1. Seleccionar la estrategia de amortización
    const strategy = this.strategies.get(input.amortizationType);
    if (!strategy) {
      throw new BadRequestError(
        `Tipo de amortización no soportado: ${input.amortizationType}`,
      );
    }

    // 2. Calcular la tabla de amortización
    const result: AmortizationResult = strategy.calculate({
      amount: input.amount,
      annualRate: input.annualRate,
      termMonths: input.termMonths,
    });

    // 3. Crear la entidad de dominio
    const credit = Credit.create({
      id: crypto.randomUUID(),
      userId: input.userId,
      amount: input.amount,
      annualRate: input.annualRate,
      termMonths: input.termMonths,
      amortizationType: input.amortizationType,
      monthlyPayment: result.monthlyPayment,
      totalInterest: result.totalInterest,
      totalPayment: result.totalPayment,
    });

    // 4. Persistir la simulación
    await this.creditRepository.save(credit);

    return {
      credit,
      schedule: result.schedule,
    };
  }
}
