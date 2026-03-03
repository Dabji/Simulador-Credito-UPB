// ============================================================
// Express Routes: Admin (Financial Parameters)
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * GET /api/admin/stats
 * Retorna estadísticas generales de administración.
 */
router.get('/stats', (_req: Request, res: Response): void => {
  // TODO: Implementar conteos reales desde los repositorios en la HU del Dashboard Admin.
  res.json({
    success: true,
    message: 'Estadísticas de administración',
    data: { usersCount: 10, simulationsCount: 45 },
  });
});

/**
 * GET /api/admin/parameters
 * Lista todos los parámetros financieros activos
 */
router.get('/parameters', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Inyectar ManageFinancialParametersUseCase
    res.json({ message: 'Parámetros financieros - TODO' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/parameters/:id
 * Actualiza un parámetro financiero
 */
router.put('/parameters/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { value } = req.body as { value: number };
    // TODO: Inyectar ManageFinancialParametersUseCase
    res.json({ message: `Parámetro ${id} actualizado a ${value} - TODO` });
  } catch (error) {
    next(error);
  }
});

export default router;
