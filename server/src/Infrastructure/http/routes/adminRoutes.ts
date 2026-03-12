// ============================================================
// Express Routes: Admin — Parámetros Financieros (RF-10, RF-23, RF-24)
// Gestión administrativa de versiones de parámetros y tasas de interés.
// Todos los endpoints bajo /api/admin → protegidos por authGuard + roleGuard(ADMIN).
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { SequelizeParameterVersionRepository } from '../../persistence/repositories/SequelizeParameterVersionRepository';
import { BadRequestError, NotFoundError } from '../../../Core/errors';
import type { UpdateParameterVersionData } from '../../../Core/repositories/IParameterVersionRepository';

const router = Router();
const paramRepo = new SequelizeParameterVersionRepository();

// ── Helpers de validación ────────────────────────────────────────────────

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

// ── GET /api/admin/stats ────────────────────────────────────────────────

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

// ── GET /api/admin/parameters/active ────────────────────────────────────

/**
 * GET /api/admin/parameters/active
 * Retorna la versión de parámetros actualmente vigente con todas sus reglas.
 * Si no existe versión activa, retorna 404.
 */
router.get('/parameters/active', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
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
router.get('/parameters', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
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
router.get('/parameters/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
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
router.put('/parameters/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
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

    const updated = await paramRepo.updateVersion(id, updateData);
    if (!updated) {
      return next(new NotFoundError(`Versión de parámetros con id '${id}' no encontrada`));
    }

    res.json({
      success: true,
      message: 'Parámetros actualizados correctamente',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
