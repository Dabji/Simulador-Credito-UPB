// ============================================================
// Express Routes: Simulator
// ============================================================

import { Router } from 'express';
import type { Request, Response } from 'express';
import { SimulateCreditUseCase } from '../../../Application/use-cases/SimulateCreditUseCase';
import { AmortizationType } from '../../../Core/entities/Credit';
// Note: from http/routes/ -> ../../../ = src/
import type { IAmortizationStrategy } from '../../../Core/strategies/IAmortizationStrategy';
import { SequelizeCreditRepository } from '../../persistence/repositories/SequelizeCreditRepository';
import { FrenchAmortizationStrategy } from '../../strategies/FrenchAmortizationStrategy';

const router = Router();

// Registrar estrategias disponibles
const strategies = new Map<AmortizationType, IAmortizationStrategy>();
strategies.set(AmortizationType.FRENCH, new FrenchAmortizationStrategy());

const creditRepository = new SequelizeCreditRepository();
const simulateUseCase = new SimulateCreditUseCase(creditRepository, strategies);

/**
 * POST /api/simulator/simulate
 * Simula un crédito educativo
 */
router.post('/simulate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, amount, annualRate, termMonths, amortizationType } =
      req.body as {
        userId: string;
        amount: number;
        annualRate: number;
        termMonths: number;
        amortizationType: AmortizationType;
      };

    const result = await simulateUseCase.execute({
      userId,
      amount,
      annualRate,
      termMonths,
      amortizationType: amortizationType ?? AmortizationType.FRENCH,
    });

    res.json({
      credit: result.credit.toJSON(),
      schedule: result.schedule,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(400).json({ error: message });
  }
});

export default router;
