// ============================================================
// Express Routes: Simulator
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { SimulateCreditUseCase } from '../../../Application/use-cases/SimulateCreditUseCase';
import { AmortizationType } from '../../../Core/entities/Credit';
import type { IAmortizationStrategy } from '../../../Core/strategies/IAmortizationStrategy';
import { AppError, BadRequestError } from '../../../Core/errors/AppError';
import { SequelizeCreditRepository } from '../../persistence/repositories/SequelizeCreditRepository';
import { FrenchAmortizationStrategy } from '../../strategies/FrenchAmortizationStrategy';
import { logger } from '../../logger';

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
router.post('/simulate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    logger.info('Simulación de crédito ejecutada', { userId, amount, termMonths });

    res.json({
      credit: result.credit.toJSON(),
      schedule: result.schedule,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new BadRequestError('Error al simular crédito'));
    }
  }
});

export default router;
