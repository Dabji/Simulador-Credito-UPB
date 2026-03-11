// ============================================================
// Express Routes: Simulator (protected — behind authGuard)
// /preview  → calcula simulación sin persistir (idéntico al público)
// /save     → calcula + persiste en BD (simulations + amortization_rows)
// /history  → lista simulaciones guardadas del usuario autenticado
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { PreviewSimulationUseCase } from '../../../Application/use-cases/PreviewSimulationUseCase';
import { SaveSimulationUseCase } from '../../../Application/use-cases/SaveSimulationUseCase';
import { SequelizeSimulationRepository } from '../../persistence/repositories/SequelizeSimulationRepository';
import { SequelizeParameterVersionRepository } from '../../persistence/repositories/SequelizeParameterVersionRepository';
import type { SimulationInput } from '../../../Application/dtos/SimulationInput';
import { logger } from '../../logger';
import type { AuthenticatedRequest } from '../middlewares/authGuard';

const router = Router();

// ── Instancias ───────────────────────────────────────────────
const simulationRepo = new SequelizeSimulationRepository();
const paramRepo      = new SequelizeParameterVersionRepository();
const previewUseCase = new PreviewSimulationUseCase(paramRepo);
const saveUseCase    = new SaveSimulationUseCase(simulationRepo, paramRepo);

/**
 * POST /api/simulator/preview
 * HU-13: Calcula una simulación sin persistencia en BD.
 */
router.post('/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const input = req.body as SimulationInput;

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

    const summary = await previewUseCase.execute(input);
    res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/simulator/save
 * Calcula la simulación, la persiste en BD (simulations + amortization_rows)
 * y la asocia al usuario autenticado.
 */
router.post('/save', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input  = req.body as SimulationInput;
    const userId = req.user?.userId as string | undefined;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const result = await saveUseCase.execute(input, userId);

    logger.info('Simulación guardada en BD', { id: result.id, userId });
    res.json({
      id: result.id,
      savedAt: result.savedAt,
      message: 'Simulación guardada exitosamente.',
      summary: result.summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/simulator/history
 * Retorna las simulaciones guardadas del usuario autenticado.
 */
router.get('/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const simulations = await simulationRepo.findByUserId(userId);
    res.json({ simulations });
  } catch (error) {
    next(error);
  }
});

export default router;
