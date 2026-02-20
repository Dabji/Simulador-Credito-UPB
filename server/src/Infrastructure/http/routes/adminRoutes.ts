// ============================================================
// Express Routes: Admin (Financial Parameters)
// ============================================================

import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /api/admin/parameters
 * Lista todos los parámetros financieros activos
 */
router.get('/parameters', async (_req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Inyectar ManageFinancialParametersUseCase
    res.json({ message: 'Parámetros financieros - TODO' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /api/admin/parameters/:id
 * Actualiza un parámetro financiero
 */
router.put('/parameters/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { value } = req.body as { value: number };
    // TODO: Inyectar ManageFinancialParametersUseCase
    res.json({ message: `Parámetro ${id} actualizado a ${value} - TODO` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(500).json({ error: message });
  }
});

export default router;
