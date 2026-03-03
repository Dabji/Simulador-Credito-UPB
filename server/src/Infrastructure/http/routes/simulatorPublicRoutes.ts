// API: endpoint público temporal HU-13 (sin auth, sin DB).
// Solo expone /preview — /save y /history requieren authGuard.

import { Router } from 'express';
import type { Request, Response } from 'express';
import { PreviewSimulationUseCase } from '../../../Application/use-cases/PreviewSimulationUseCase';
import type { SimulationInput } from '../../../Application/dtos/SimulationInput';

const router = Router();

const previewUseCase = new PreviewSimulationUseCase();

/**
 * POST /api/simulator/preview
 * Calcula y retorna simulación con datos reales (HU-13 Criterio 2 y 3).
 * Público temporal: sin autenticación requerida.
 */
router.post('/preview', (req: Request, res: Response): void => {
  try {
    const input = req.body as SimulationInput;

    // Validaciones básicas de presencia
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

export default router;
