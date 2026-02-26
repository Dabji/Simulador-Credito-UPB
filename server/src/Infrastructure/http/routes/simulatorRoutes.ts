// ============================================================
// Express Routes: Simulator (protected — behind authGuard)
// ============================================================

import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { SimulateCreditUseCase } from '../../../Application/use-cases/SimulateCreditUseCase';
import { PreviewSimulationUseCase } from '../../../Application/use-cases/PreviewSimulationUseCase';
import { AmortizationType } from '../../../Core/entities/Credit';
import type { IAmortizationStrategy } from '../../../Core/strategies/IAmortizationStrategy';
import { AppError, BadRequestError } from '../../../Core/errors';
import { SequelizeCreditRepository } from '../../persistence/repositories/SequelizeCreditRepository';
import { FrenchAmortizationStrategy } from '../../strategies/FrenchAmortizationStrategy';
import type { SimulationInput } from '../../../Application/dtos/SimulationInput';
import { logger } from '../../logger';

const router = Router();

// ── Instancias (ruta existente con DB) ────────────────────────────────────
const strategies = new Map<AmortizationType, IAmortizationStrategy>();
strategies.set(AmortizationType.FRENCH, new FrenchAmortizationStrategy());
const creditRepository = new SequelizeCreditRepository();
const simulateUseCase  = new SimulateCreditUseCase(creditRepository, strategies);

// ── Instancia del nuevo caso de uso sin DB (HU-13) ────────────────────────
const previewUseCase = new PreviewSimulationUseCase();

// API: endpoint temporal sin auth (solo para HU-13)
// Almacenamiento in-memory de simulaciones guardadas (starred)
const savedSimulations = new Map<string, SimulationInput & { id: string }>();

/**
 * POST /api/simulator/simulate
 * Ruta existente — simula usando DB (requiere auth por app.ts).
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

/**
 * POST /api/simulator/preview
 * HU-13: Calcula una simulación sin persistencia en BD y sin autenticación.
 * Body: SimulationInput
 * Response: SimulationSummary (incluye schedule)
 */
router.post('/preview', (req: Request, res: Response): void => {
  try {
    const input = req.body as SimulationInput;

    // Validaciones básicas de presencia (el resto las hace SimulationService)
    if (!input.studentType || !input.educationLevel) {
      res.status(400).json({ error: 'studentType y educationLevel son requeridos.' });
      return;
    }
    if (!input.tuitionGross || input.tuitionGross <= 0) {
      res.status(400).json({ error: 'tuitionGross debe ser un número positivo.' });
      return;
    }
    if (!input.academicPeriod || !input.firstPaymentMonth || !input.numberOfPayments) {
      res.status(400).json({ error: 'academicPeriod, firstPaymentMonth y numberOfPayments son requeridos.' });
      return;
    }

    const summary = previewUseCase.execute(input);
    res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/simulator/save
 * HU-13 (opcional): Guarda simulación en memoria si starred === true.
 * Response: { id: string, message: string }
 */
router.post('/save', (req: Request, res: Response): void => {
  try {
    const input = req.body as SimulationInput;

    if (!input.starred) {
      res.status(400).json({ error: 'Solo se pueden guardar simulaciones destacadas (starred: true).' });
      return;
    }

    const id = randomUUID();
    savedSimulations.set(id, { ...input, id });

    res.json({ id, message: 'Simulación guardada exitosamente.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(400).json({ error: message });
  }
});

export default router;
