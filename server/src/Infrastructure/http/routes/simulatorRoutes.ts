// ============================================================
// Express Routes: Simulator (protected — behind authGuard)
// /preview  → calcula simulación sin persistir (idéntico al público)
// /save     → calcula + persiste en BD (simulations + amortization_rows)
// /history  → lista simulaciones guardadas del usuario autenticado
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { PreviewSimulationUseCase } from '../../../Application/use-cases/PreviewSimulationUseCase';
import { SaveSimulationUseCase } from '../../../Application/use-cases/SaveSimulationUseCase';
import { SequelizeSimulationRepository } from '../../persistence/repositories/SequelizeSimulationRepository';
import { SequelizeParameterVersionRepository } from '../../persistence/repositories/SequelizeParameterVersionRepository';
import { SimulationModel } from '../../persistence/models/SimulationModel';
import { UserModel } from '../../persistence/models/UserModel';
import type { SimulationInput } from '../../../Application/dtos/SimulationInput';
import { logger } from '../../logger';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
import { auditLog, extractIp } from '../../../Application/services/AuditService';
import { buildSimulationPdf } from '../../../Application/services/export/SimulationPdfBuilder';
import { ExportLogModel } from '../../persistence/models/ExportLogModel';

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
        simulation_id:        result.id,
        user_id:              userId,
        level:                input.educationLevel,
        modality:             input.interestMode,
        parameter_version_id: result.parameterVersionId,
        financed_value:       result.summary.financedValue,
        total_payments:       result.summary.numberOfPayments,
        applied_rate_monthly: result.appliedRateMonthly,
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
 * HU-35: Lista paginada + filtrada de simulaciones del usuario autenticado.
 * Query params: q (texto), filter (campo), page (número), pageSize (número)
 */
router.get('/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const q      = typeof req.query['q']      === 'string' ? req.query['q'].trim() : '';
    const filter  = typeof req.query['filter'] === 'string' ? req.query['filter']   : '';

    const rawPage     = parseInt(String(req.query['page']     ?? ''), 10);
    const rawPageSize = parseInt(String(req.query['pageSize'] ?? ''), 10);
    const page     = Math.max(1, Number.isNaN(rawPage)     ? 1  : rawPage);
    const pageSize = Math.min(50, Math.max(1, Number.isNaN(rawPageSize) ? 10 : rawPageSize));
    const offset   = (page - 1) * pageSize;

    // Obtener datos del usuario autenticado (nombre, email)
    const user = await UserModel.findByPk(userId, {
      attributes: ['first_name', 'last_name', 'email'],
    });
    const studentName  = user ? `${user.first_name} ${user.last_name}`.trim() : '';
    const studentEmail = user?.email ?? '';

    // Condición base: solo del usuario, no eliminadas
    const baseWhere: Record<string, unknown> = { user_id: userId, deleted_at: null };

    // Condición de búsqueda por filtro
    if (q) {
      const qLike = `%${q}%`;
      switch (filter) {
        case 'modality':
          baseWhere['modality'] = { [Op.like]: qLike };
          break;
        case 'academicPeriod':
          baseWhere['academic_period'] = { [Op.like]: qLike };
          break;
        case 'createdAt':
          baseWhere['created_at'] = { [Op.like]: qLike };
          break;
        default:
          // búsqueda general: modalidad, periodo académico o fecha
          baseWhere[Op.or as unknown as string] = [
            { modality:         { [Op.like]: qLike } },
            { academic_period:  { [Op.like]: qLike } },
            { created_at:       { [Op.like]: qLike } },
          ];
          break;
      }
    }

    const { count, rows } = await SimulationModel.findAndCountAll({
      where: baseWhere,
      attributes: [
        'id', 'created_at', 'modality', 'financed_value',
        'initial_payment_value', 'first_payment_date', 'total_payments', 'academic_period',
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    const items = rows.map((sim) => ({
      id:                  sim.id,
      createdAt:           sim.created_at,
      studentName,
      studentEmail,
      modality:            sim.modality,
      financedValue:       Number(sim.financed_value),
      initialPaymentValue: Number(sim.initial_payment_value),
      firstPaymentDate:    sim.first_payment_date,
      numberOfPayments:    sim.total_payments,
      academicPeriod:      sim.academic_period ?? '',
    }));

    res.json({
      items,
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════════════════════
// HU-36: Detalle de una simulación guardada (ESTUDIANTE)
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/simulator/history/:id
 * HU-36: Retorna el detalle completo de una simulación con datos del estudiante.
 * Solo accesible por el dueño de la simulación.
 */
router.get('/history/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const simId = String(req.params['id'] ?? '').trim();
    if (!simId) {
      res.status(400).json({ error: 'ID de simulación requerido.' });
      return;
    }

    const simulation = await simulationRepo.findByIdWithUser(simId);
    if (!simulation || simulation.userId !== userId) {
      res.status(404).json({ error: 'Simulación no encontrada.' });
      return;
    }

    res.json(simulation);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════════════════════
// HU-36 / HU-40: Exportar simulación como PDF (ESTUDIANTE)
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/simulator/history/:id/export/pdf
 * HU-36: Genera y descarga el PDF de una simulación.
 * Solo accesible por el dueño de la simulación.
 */
router.get('/history/:id/export/pdf', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const simId = String(req.params['id'] ?? '').trim();
    if (!simId) {
      res.status(400).json({ error: 'ID de simulación requerido.' });
      return;
    }

    const simulation = await simulationRepo.findByIdWithUser(simId);
    if (!simulation || simulation.userId !== userId) {
      res.status(404).json({ error: 'Simulación no encontrada.' });
      return;
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await buildSimulationPdf(simulation);
    } catch (pdfErr) {
      logger.error('buildSimulationPdf falló', {
        simulation_id: simId,
        error: pdfErr instanceof Error ? pdfErr.message : String(pdfErr),
        stack: pdfErr instanceof Error ? pdfErr.stack : undefined,
      });
      throw pdfErr;
    }

    let safeName = `${simulation.student.firstName} ${simulation.student.lastName}`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-');
    if (!safeName) safeName = 'estudiante';
    let safeId = String(simulation.student.identificationNumber ?? '').replace(/[^a-zA-Z0-9]/g, '');
    if (!safeId) safeId = simId.slice(0, 8);
    const filename = `simulacion-upb-${safeName}-${safeId}.pdf`;

    const contentFlags = { summary: true, amortizationTable: true, charts: true };

    // Registrar en export_logs (HU-40)
    void ExportLogModel.create({
      format:        'PDF',
      simulation_id: simId,
      user_id:       userId,
      ip_address:    extractIp(req) ?? null,
      file_name:     filename,
      content_flags: JSON.stringify(contentFlags),
    }).catch((err: unknown) => {
      logger.warn('Failed to persist export log', { error: err, simulation_id: simId, format: 'PDF', user_id: userId });
    });

    void auditLog({
      action:     'SIMULATION_EXPORTED_PDF',
      entity:     'SIMULATION',
      entity_id:  simId,
      actor_type: 'STUDENT',
      user_id:    userId,
      ip_address: extractIp(req),
      details:    {
        simulation_id:            simId,
        format:                   'PDF',
        include_summary:          contentFlags.summary,
        include_amortization_table: contentFlags.amortizationTable,
        include_charts:           contentFlags.charts,
        file_name:                filename,
      },
    });

    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length',      pdfBuffer.length);
    res.send(pdfBuffer);
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
        interest_mode:   simulation.summary.interestMode,
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
