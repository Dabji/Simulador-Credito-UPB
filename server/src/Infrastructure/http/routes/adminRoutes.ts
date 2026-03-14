// ============================================================
// Express Routes: Admin — Parámetros Financieros (RF-10, RF-23, RF-24)
// Gestión administrativa de versiones de parámetros y tasas de interés.
// Todos los endpoints bajo /api/admin → protegidos por authGuard + roleGuard(ADMIN).
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { SequelizeParameterVersionRepository } from '../../persistence/repositories/SequelizeParameterVersionRepository';
import { BadRequestError, NotFoundError } from '../../../Core/errors';
import type { UpdateParameterVersionData } from '../../../Core/repositories/IParameterVersionRepository';
import { AuditLogModel } from '../../persistence/models/AuditLogModel';
import type { AuthenticatedRequest } from '../middlewares/authGuard';

const router = Router();
const paramRepo = new SequelizeParameterVersionRepository();

// ── Helpers de validación ────────────────────────────────────────────────

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

// ── GET /api/admin/parameters/audit ─────────────────────────────────────

/**
 * GET /api/admin/parameters/audit
 * Retorna el historial de cambios de parametrización (HU-25, Criterio 3).
 * Query params: limit (default 50), offset (default 0)
 */
router.get('/parameters/audit', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit  = Math.min(parseInt(String(req.query['limit']  ?? '50'), 10) || 50, 200);
    const offset = parseInt(String(req.query['offset'] ?? '0'),  10) || 0;

    const { rows, count } = await AuditLogModel.findAndCountAll({
      where: { entity: 'PARAMETER_VERSION' },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        total: count,
        limit,
        offset,
        logs: rows.map(r => {
          // Lógica robusta: Si ya es un objeto, lo usamos; si es string, lo parseamos.
          let parsed: { changeSummary: string; previousSnapshot: any; newSnapshot: any };
          
          try {
            parsed = typeof r.details === 'string' 
              ? JSON.parse(r.details) 
              : r.details;
          } catch (e) {
            parsed = { 
              changeSummary: 'Error al procesar detalles', 
              previousSnapshot: {}, 
              newSnapshot: {} 
            };
          }

          return {
            id:                 r.id,
            parameterVersionId: r.entity_id,
            adminUserId:         r.user_id,
            action:             r.action,
            ipAddress:           r.ip_address,
            changedAt:           r.created_at,
            changeSummary:       parsed?.changeSummary || 'Sin resumen',
            previousSnapshot:    parsed?.previousSnapshot || {},
            newSnapshot:         parsed?.newSnapshot || {},
          };
        }),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/stats ────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Retorna estadísticas generales de administración.
 */
router.get('/stats', (_req: AuthenticatedRequest, res: Response): void => {
  // TODO: Implementar conteos reales desde los repositorios en la HU del Dashboard Admin.
  res.json({
    success: true,
    message: 'Estadísticas de administración',
    data: { usersCount: 10, simulationsCount: 45 },
  });
});

// ── GET /api/admin/parameters/active ────────────────────────────────────

/**
 * GET /api/admin/parameters/active
 * Retorna la versión de parámetros actualmente vigente con todas sus reglas.
 * Si no existe versión activa, retorna 404.
 */
router.get('/parameters/active', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const version = await paramRepo.findActive();
    if (!version) {
      return next(new NotFoundError('No existe una versión de parámetros activa para la fecha actual'));
    }
    res.json({ success: true, data: version });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/parameters ────────────────────────────────────────────

/**
 * GET /api/admin/parameters
 * Lista todas las versiones de parámetros (resumen: id, vigencia, notas, isActive).
 */
router.get('/parameters', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const versions = await paramRepo.findAll();
    res.json({ success: true, data: versions });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/parameters/:id ────────────────────────────────────────

/**
 * GET /api/admin/parameters/:id
 * Retorna una versión específica de parámetros con todas sus reglas.
 */
router.get('/parameters/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const version = await paramRepo.findById(id);
    if (!version) {
      return next(new NotFoundError(`Versión de parámetros con id '${id}' no encontrada`));
    }
    res.json({ success: true, data: version });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/admin/parameters/:id ────────────────────────────────────────

/**
 * PUT /api/admin/parameters/:id
 * Actualiza una versión de parámetros: fechas de vigencia, tasas de interés y reglas.
 *
 * Body (todos los campos son opcionales; se actualiza solo lo que se envíe):
 * {
 *   validFrom?: "YYYY-MM-DD",
 *   validTo?: "YYYY-MM-DD" | null,
 *   notes?: string,
 *   interestRates?: [{ levelScope, rateMonthly }],
 *   modalityRules?: [{ modality, level, maxTotalPayments, minInitialPct }],
 *   initialPaymentRules?: [{ level, modality, extraInstallments, initialPctRequired }]
 * }
 *
 * Validaciones:
 *  - Las fechas deben ser válidas (YYYY-MM-DD).
 *  - validFrom debe ser anterior a validTo (si se especifica).
 *  - Las tasas de interés deben ser mayores que cero para con_interes.
 *  - No puede existir superposición de vigencias con otras versiones.
 */
router.put('/parameters/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as {
      validFrom?: string;
      validTo?: string | null;
      notes?: string | null;
      interestRates?: { levelScope: string; rateMonthly: number }[];
      modalityRules?: { modality: string; level: string; maxTotalPayments: number; minInitialPct: number }[];
      initialPaymentRules?: { level: string; modality: string; extraInstallments: number; initialPctRequired: number }[];
    };

    // ── Validación de fechas ─────────────────────────────────
    if (body.validFrom !== undefined && !isValidDate(body.validFrom)) {
      return next(new BadRequestError('validFrom debe tener el formato YYYY-MM-DD'));
    }
    if (body.validTo !== undefined && body.validTo !== null && !isValidDate(body.validTo)) {
      return next(new BadRequestError('validTo debe tener el formato YYYY-MM-DD'));
    }
    if (
      body.validFrom && body.validTo &&
      new Date(body.validFrom) >= new Date(body.validTo)
    ) {
      return next(new BadRequestError('validFrom debe ser anterior a validTo'));
    }

    // ── Validación de tasas de interés ───────────────────────
    if (body.interestRates !== undefined) {
      if (!Array.isArray(body.interestRates)) {
        return next(new BadRequestError('interestRates debe ser un arreglo'));
      }
      const validLevels = ['PREGRADO', 'POSGRADO', 'UPB_TEC'];
      for (const rate of body.interestRates) {
        if (!validLevels.includes(rate.levelScope)) {
          return next(new BadRequestError(`levelScope '${rate.levelScope}' inválido. Valores válidos: ${validLevels.join(', ')}`));
        }
        if (!Number.isFinite(rate.rateMonthly) || rate.rateMonthly <= 0 || rate.rateMonthly > 1) {
          return next(new BadRequestError(`rateMonthly para ${rate.levelScope} debe ser un número mayor que 0 y menor o igual a 1 (ej: 0.009 para 0.9%)`));
        }
      }
      // Verificar que no haya niveles duplicados
      const levels = body.interestRates.map(r => r.levelScope);
      if (new Set(levels).size !== levels.length) {
        return next(new BadRequestError('No se pueden registrar dos tasas para el mismo nivel educativo'));
      }
    }

    // ── Validación de reglas de modalidad ────────────────────
    if (body.modalityRules !== undefined) {
      if (!Array.isArray(body.modalityRules)) {
        return next(new BadRequestError('modalityRules debe ser un arreglo'));
      }
      const validModalities = ['SIN_INTERES', 'CON_INTERES'];
      const validLevels = ['PREGRADO', 'POSGRADO', 'UPB_TEC'];
      for (const rule of body.modalityRules) {
        if (!validModalities.includes(rule.modality)) {
          return next(new BadRequestError(`modality '${rule.modality}' inválida`));
        }
        if (!validLevels.includes(rule.level)) {
          return next(new BadRequestError(`level '${rule.level}' inválido`));
        }
        if (!Number.isInteger(rule.maxTotalPayments) || rule.maxTotalPayments < 1 || rule.maxTotalPayments > 12) {
          return next(new BadRequestError('maxTotalPayments debe ser un entero entre 1 y 12'));
        }
        if (!Number.isFinite(rule.minInitialPct) || rule.minInitialPct <= 0 || rule.minInitialPct > 1) {
          return next(new BadRequestError('minInitialPct debe ser entre 0 y 1 (ej: 0.20 para 20%)'));
        }
      }
    }

    // ── Validación de reglas de cuota inicial ─────────────────
    if (body.initialPaymentRules !== undefined) {
      if (!Array.isArray(body.initialPaymentRules)) {
        return next(new BadRequestError('initialPaymentRules debe ser un arreglo'));
      }
      const validLevelsPmt = ['PREGRADO', 'POSGRADO', 'UPB_TEC'];
      const validModalitiesPmt = ['SIN_INTERES', 'CON_INTERES'];
      for (const rule of body.initialPaymentRules) {
        if (!validLevelsPmt.includes(rule.level)) {
          return next(new BadRequestError(`level '${rule.level}' inválido en initialPaymentRules`));
        }
        if (!validModalitiesPmt.includes(rule.modality)) {
          return next(new BadRequestError(`modality '${rule.modality}' inválida en initialPaymentRules`));
        }
        if (!Number.isInteger(rule.extraInstallments) || rule.extraInstallments < 0) {
          return next(new BadRequestError('extraInstallments debe ser un entero mayor o igual a 0'));
        }
        if (!Number.isFinite(rule.initialPctRequired) || rule.initialPctRequired <= 0 || rule.initialPctRequired > 1) {
          return next(new BadRequestError('initialPctRequired debe ser entre 0 y 1 (ej: 0.20 para 20%)'));
        }
      }
    }

    // ── Verificación de superposición de vigencias ───────────
    if (body.validFrom !== undefined || body.validTo !== undefined) {
      // Para verificar el solapamiento necesitamos saber los valores actuales de la versión
      const current = await paramRepo.findById(id);
      if (!current) {
        return next(new NotFoundError(`Versión de parámetros con id '${id}' no encontrada`));
      }
      const fromToCheck = body.validFrom ?? current.validFrom;
      const toToCheck = body.validTo !== undefined ? body.validTo : current.validTo;

      const overlaps = await paramRepo.hasOverlap(fromToCheck, toToCheck, id);
      if (overlaps) {
        return next(new BadRequestError(
          'La vigencia especificada se superpone con otra versión de parámetros existente. ' +
          'Ajuste las fechas para evitar conflictos.',
        ));
      }
    }

    // ── Construir DTO de actualización ───────────────────────
    const updateData: UpdateParameterVersionData = {
      ...(body.validFrom !== undefined && { validFrom: body.validFrom }),
      ...(body.validTo !== undefined && { validTo: body.validTo }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.interestRates && {
        interestRates: body.interestRates.map(r => ({
          levelScope: r.levelScope as 'PREGRADO' | 'POSGRADO' | 'UPB_TEC',
          rateMonthly: r.rateMonthly,
        })),
      }),
      ...(body.modalityRules && {
        modalityRules: body.modalityRules.map(r => ({
          modality: r.modality as 'SIN_INTERES' | 'CON_INTERES',
          level: r.level as 'PREGRADO' | 'POSGRADO' | 'UPB_TEC',
          maxTotalPayments: r.maxTotalPayments,
          minInitialPct: r.minInitialPct,
        })),
      }),
      ...(body.initialPaymentRules && {
        initialPaymentRules: body.initialPaymentRules.map(r => ({
          level: r.level as 'PREGRADO' | 'POSGRADO' | 'UPB_TEC',
          modality: r.modality as 'SIN_INTERES' | 'CON_INTERES',
          extraInstallments: r.extraInstallments,
          initialPctRequired: r.initialPctRequired,
        })),
      }),
    };

    // ── Capturar snapshot anterior para auditoría (HU-25, Criterio 2) ──
    const previous = await paramRepo.findById(id);
    if (!previous) {
      return next(new NotFoundError(`Versión de parámetros con id '${id}' no encontrada`));
    }

    const updated = await paramRepo.updateVersion(id, updateData);
    if (!updated) {
      return next(new NotFoundError(`Versión de parámetros con id '${id}' no encontrada`));
    }

    // ── Persistir registro de auditoría ─────────────────────────────────
    const adminUserId = String(req.user?.['userId'] ?? 'unknown');
    const adminEmail  = String(req.user?.['email']  ?? 'unknown');

    const changedFields: string[] = [];
    if (updateData.validFrom       !== undefined) changedFields.push('validFrom');
    if (updateData.validTo         !== undefined) changedFields.push('validTo');
    if (updateData.notes           !== undefined) changedFields.push('notes');
    if (updateData.interestRates   !== undefined) changedFields.push('interestRates');
    if (updateData.modalityRules   !== undefined) changedFields.push('modalityRules');
    if (updateData.initialPaymentRules !== undefined) changedFields.push('initialPaymentRules');

    const ipAddress = (req.headers['x-forwarded-for'] as string | undefined)
      ?? req.socket.remoteAddress
      ?? null;

    await AuditLogModel.create({
      action:     'UPDATE_PARAMETER_VERSION',
      entity:     'PARAMETER_VERSION',
      entity_id:  id,
      actor_type: 'ADMIN',
      user_id:    adminUserId !== 'unknown' ? adminUserId : null,
      ip_address: ipAddress ?? null,
      details: JSON.stringify({
        adminEmail,
        changeSummary:      `Campos modificados: ${changedFields.join(', ')}`,
        previousSnapshot:   previous,
        newSnapshot:        updated,
      }),
    });

    res.json({
      success: true,
      message: 'Parámetros actualizados correctamente. El cambio ha quedado registrado y aplicará a simulaciones futuras.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
