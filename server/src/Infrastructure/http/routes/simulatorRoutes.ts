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
import { SimulationModel } from '../../persistence/models/SimulationModel';
import type { SimulationInput } from '../../../Application/dtos/SimulationInput';
import { logger } from '../../logger';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
import { auditLog, extractIp } from '../../../Application/services/AuditService';

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

    await auditLog({
      action:     'SIMULATION_SAVED',
      entity:     'SIMULATION',
      entity_id:  result.id,
      actor_type: 'STUDENT',
      user_id:    userId,
      ip_address: extractIp(req),
      details:    {
        simulation_id:  result.id,
        education_level: input.educationLevel,
        interest_mode:   input.interestMode,
        tuition_gross:   input.tuitionGross,
        payments:        input.numberOfPayments,
      },
    });

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

/**
 * DELETE /api/simulator/:id
 * Soft-delete de una simulación del usuario autenticado.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const simId = req.params['id'] as string;
    const reason = (req.body as { reason?: string })?.reason ?? 'Eliminado por el usuario';

    const sim = await SimulationModel.findOne({ where: { id: simId, user_id: userId, deleted_at: null } });
    if (!sim) {
      res.status(404).json({ error: 'Simulación no encontrada.' });
      return;
    }

    await SimulationModel.update(
      { deleted_at: new Date(), deleted_by: userId, delete_reason: reason },
      { where: { id: simId } },
    );

    await auditLog({
      action:     'SIMULATION_DELETED',
      entity:     'SIMULATION',
      entity_id:  simId,
      actor_type: 'STUDENT',
      user_id:    userId,
      ip_address: extractIp(req),
      details:    { simulation_id: simId, reason, origin: 'STUDENT' },
    });

    logger.info('Simulación eliminada (soft-delete)', { id: simId, userId });
    res.json({ success: true, message: 'Simulación eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/simulator/:id/export
 * Exporta los datos de una simulación en formato JSON.
 * Registra SIMULATION_EXPORTED en auditoría.
 */
router.get('/:id/export', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const simId = req.params['id'] as string;
    const format = (req.query['format'] as string) ?? 'json';

    const simulation = await simulationRepo.findById(simId);
    if (!simulation || simulation.userId !== userId) {
      res.status(404).json({ error: 'Simulación no encontrada.' });
      return;
    }

    await auditLog({
      action:     'SIMULATION_EXPORTED',
      entity:     'SIMULATION',
      entity_id:  simId,
      actor_type: 'STUDENT',
      user_id:    userId,
      ip_address: extractIp(req),
      details:    {
        simulation_id: simId,
        format,
        education_level: simulation.summary.interestMode,
        total_paid:      simulation.summary.totalPaid,
      },
    });

    logger.info('Simulación exportada', { id: simId, userId, format });

    res.setHeader('Content-Disposition', `attachment; filename="simulacion-${simId}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, data: simulation.summary });
  } catch (error) {
    next(error);
  }
});

export default router;
