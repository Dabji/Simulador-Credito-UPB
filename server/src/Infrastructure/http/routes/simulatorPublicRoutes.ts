// API: endpoint público temporal HU-13 (sin auth, sin DB).
// Solo expone /preview — /save y /history requieren authGuard.

import { Router } from 'express';
import type { Request, Response } from 'express';
import { PreviewSimulationUseCase } from '../../../Application/use-cases/PreviewSimulationUseCase';
import { SequelizeParameterVersionRepository } from '../../persistence/repositories/SequelizeParameterVersionRepository';
import { SimulationInputSchema } from '../../../Application/dtos/SimulationInput';

const router = Router();

const paramRepo = new SequelizeParameterVersionRepository();
const previewUseCase = new PreviewSimulationUseCase(paramRepo);

/**
 * POST /api/simulator/preview
 * Calcula y retorna simulación con datos reales (HU-13 Criterio 2 y 3).
 * Público temporal: sin autenticación requerida.
 */
router.post('/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = SimulationInputSchema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message);
      res.status(400).json({ error: messages.join('. ') });
      return;
    }

    const summary = await previewUseCase.execute(result.data);
    res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    res.status(400).json({ error: message });
  }
});

export default router;
