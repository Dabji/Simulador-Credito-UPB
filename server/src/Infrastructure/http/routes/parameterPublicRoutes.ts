// Ruta pública: retorna los parámetros activos del simulador.
// Consumido por SimulationForm (student + guest) para reflejar
// tasa vigente, cuota inicial mínima, límites de cuotas, etc.
// Sin autenticación requerida — montado ANTES del authGuard.

import { Router } from 'express';
import type { Request, Response } from 'express';
import { SequelizeParameterVersionRepository } from '../../persistence/repositories/SequelizeParameterVersionRepository';

const router = Router();
const paramRepo = new SequelizeParameterVersionRepository();

/**
 * GET /api/parameters/active
 * Retorna la versión activa de parámetros con todas sus reglas.
 * Público: tanto estudiantes como invitados necesitan estos datos
 * para reflejar tasas, mínimos y límites dinámicamente en el formulario.
 */
router.get('/active', async (_req: Request, res: Response): Promise<void> => {
  try {
    const active = await paramRepo.findActive();
    if (!active) {
      res.status(404).json({
        error: 'No hay una versión de parámetros activa en este momento.',
      });
      return;
    }

    res.json({ success: true, data: active });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    res.status(500).json({ error: message });
  }
});

export default router;
