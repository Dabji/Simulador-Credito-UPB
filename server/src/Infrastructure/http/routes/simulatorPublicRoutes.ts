// API: endpoints públicos temporales HU-13 (sin auth, sin DB).
// Solo expone /preview y /save — el resto de rutas requiere authGuard.

import { Router } from 'express';
import type { Request, Response } from 'express';
import { PreviewSimulationUseCase } from '../../../Application/use-cases/PreviewSimulationUseCase';
import type { SimulationInput } from '../../../Application/dtos/SimulationInput';

const router = Router();

const previewUseCase = new PreviewSimulationUseCase();

// Almacenamiento in-memory de simulaciones guardadas (starred) — sin BD
const savedSimulations = new Map<string, SimulationInput & { id: string }>();

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

/**
 * POST /api/simulator/save
 * Guarda simulación en memoria si starred === true (HU-13 opcional).
 */
router.post('/save', (req: Request, res: Response): void => {
  try {
    const input = req.body as SimulationInput;

    if (!input.starred) {
      res.status(400).json({ error: 'Solo se pueden guardar simulaciones destacadas (starred: true).' });
      return;
    }

    const id = crypto.randomUUID();
    savedSimulations.set(id, { ...input, id });

    res.json({ id, message: 'Simulación guardada exitosamente.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(400).json({ error: message });
  }
});

export default router;
