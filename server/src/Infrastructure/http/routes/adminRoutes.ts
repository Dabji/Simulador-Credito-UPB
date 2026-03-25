// ============================================================
// Express Routes: Admin — Parámetros Financieros (RF-10, RF-23, RF-24)
// y Gestión de Usuarios (HU-82).
// Todos los endpoints bajo /api/admin → protegidos por authGuard + roleGuard(ADMIN).
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { SequelizeParameterVersionRepository } from '../../persistence/repositories/SequelizeParameterVersionRepository';
import { SequelizeUserRepository } from '../../persistence/repositories/SequelizeUserRepository';
import { SequelizeSimulationRepository } from '../../persistence/repositories/SequelizeSimulationRepository';
import { SimulationModel } from '../../persistence/models/SimulationModel';
import { UserModel } from '../../persistence/models/UserModel';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../../Core/errors';
import type { UpdateParameterVersionData, CreateParameterVersionData } from '../../../Core/repositories/IParameterVersionRepository';
import { AuditLogModel } from '../../persistence/models/AuditLogModel';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
import { auditLog, extractIp } from '../../../Application/services/AuditService';
import { logger } from '../../logger';
import { buildSimulationCsv } from '../../../Application/services/export/SimulationCsvBuilder';
import { buildSimulationPdf } from '../../../Application/services/export/SimulationPdfBuilder';
import { ExportLogModel } from '../../persistence/models/ExportLogModel';
import { ListUsersByAdminUseCase } from '../../../Application/use-cases/ListUsersByAdminUseCase';
import type { UserFilterField, UserFilterCriterion } from '../../../Application/use-cases/ListUsersByAdminUseCase';
import { GetUserByAdminUseCase } from '../../../Application/use-cases/GetUserByAdminUseCase';
import { UpdateUserByAdminUseCase } from '../../../Application/use-cases/UpdateUserByAdminUseCase';
import { ListUserSimulationsByAdminUseCase } from '../../../Application/use-cases/ListUserSimulationsByAdminUseCase';
import { GetSimulationByIdAdminUseCase } from '../../../Application/use-cases/GetSimulationByIdAdminUseCase';
import { UpdateUserByAdminSchema, UpdateUserByAdminInputSchema } from '../../../Application/dtos/UpdateUserByAdminInput';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const paramRepo      = new SequelizeParameterVersionRepository();
const userRepo       = new SequelizeUserRepository();
const simulationRepo = new SequelizeSimulationRepository();

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
    const rawLimit  = Number.parseInt(String(req.query['limit']  ?? '50'), 10);
    const rawOffset = Number.parseInt(String(req.query['offset'] ?? '0'),  10);
    const limit  = Math.min(Math.max(Number.isNaN(rawLimit)  ? 50 : rawLimit,  1), 200);
    const offset = Math.max(Number.isNaN(rawOffset) ? 0 : rawOffset, 0);

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
          let parsed: { changeSummary: string; previousSnapshot: any; newSnapshot: any; adminEmail?: string };
          
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
            adminUserId:        r.user_id,
            adminEmail:         parsed?.adminEmail ?? undefined,
            action:             r.action,
            ipAddress:          r.ip_address,
            changedAt:          r.created_at,
            changeSummary:      parsed?.changeSummary || 'Sin resumen',
            previousSnapshot:   parsed?.previousSnapshot || {},
            newSnapshot:        parsed?.newSnapshot || {},
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

// ── POST /api/admin/parameters ───────────────────────────────────────────

/**
 * POST /api/admin/parameters
 * Crea una nueva versión de parámetros (opción inactiva).
 * Body: { validFrom, validTo?, notes?, interestRates, modalityRules, initialPaymentRules }
 */
router.post('/parameters', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as {
      validFrom: string;
      validTo?: string | null;
      notes?: string | null;
      interestRates: { levelScope: string; rateMonthly: number }[];
      modalityRules: { modality: string; level: string; maxTotalPayments: number; minInitialPct: number }[];
      initialPaymentRules: { level: string; modality: string; extraInstallments: number; initialPctRequired: number }[];
    };

    if (!body.validFrom || !isValidDate(body.validFrom)) {
      return next(new BadRequestError('validFrom es obligatorio y debe tener formato YYYY-MM-DD'));
    }
    if (body.validTo !== undefined && body.validTo !== null && !isValidDate(body.validTo)) {
      return next(new BadRequestError('validTo debe tener formato YYYY-MM-DD'));
    }
    if (!Array.isArray(body.interestRates) || body.interestRates.length === 0) {
      return next(new BadRequestError('interestRates es obligatorio y debe tener al menos un elemento'));
    }
    if (!Array.isArray(body.modalityRules) || body.modalityRules.length === 0) {
      return next(new BadRequestError('modalityRules es obligatorio'));
    }
    if (!Array.isArray(body.initialPaymentRules) || body.initialPaymentRules.length === 0) {
      return next(new BadRequestError('initialPaymentRules es obligatorio'));
    }

    // Validar que validFrom sea anterior a validTo (si se especifica)
    if (
      body.validTo &&
      new Date(body.validFrom) >= new Date(body.validTo)
    ) {
      return next(new BadRequestError('validFrom debe ser anterior a validTo'));
    }

    // Verificar superposición de vigencias con versiones existentes
    const overlaps = await paramRepo.hasOverlap(body.validFrom, body.validTo ?? null);
    if (overlaps) {
      return next(new BadRequestError(
        'La vigencia especificada se superpone con otra versión de parámetros existente. ' +
        'Ajuste las fechas para evitar conflictos.',
      ));
    }

    const adminUserId = req.user?.['userId'] as string | undefined;
    if (!adminUserId) {
      return next(new UnauthorizedError('No se pudo determinar el usuario administrador'));
    }

    const createData: CreateParameterVersionData = {
      createdBy: adminUserId,
      validFrom: body.validFrom,
      validTo: body.validTo ?? null,
      notes: body.notes ?? null,
      interestRates: body.interestRates.map(r => ({
        levelScope: r.levelScope as 'PREGRADO' | 'POSGRADO' | 'UPB_TEC',
        rateMonthly: r.rateMonthly,
      })),
      modalityRules: body.modalityRules.map(r => ({
        modality: r.modality as 'SIN_INTERES' | 'CON_INTERES',
        level: r.level as 'PREGRADO' | 'POSGRADO' | 'UPB_TEC',
        maxTotalPayments: r.maxTotalPayments,
        minInitialPct: r.minInitialPct,
      })),
      initialPaymentRules: body.initialPaymentRules.map(r => ({
        level: r.level as 'PREGRADO' | 'POSGRADO' | 'UPB_TEC',
        modality: r.modality as 'SIN_INTERES' | 'CON_INTERES',
        extraInstallments: r.extraInstallments,
        initialPctRequired: r.initialPctRequired,
      })),
    };

    const created = await paramRepo.createVersion(createData);

    await auditLog({
      action:     'CREATE_PARAMETER_VERSION',
      entity:     'PARAMETER_VERSION',
      entity_id:  created.id,
      actor_type: 'ADMIN',
      user_id:    adminUserId,
      ip_address: extractIp(req),
      details:    { validFrom: body.validFrom, validTo: body.validTo ?? null },
    });

    res.status(201).json({ success: true, data: created, message: 'Versión de parámetros creada.' });
  } catch (error) {
    next(error);
  }
});

// ── PATCH /api/admin/parameters/:id/activate ─────────────────────────────

/**
 * PATCH /api/admin/parameters/:id/activate
 * Activa una versión de parámetros y desactiva las demás.
 */
router.patch('/parameters/:id/activate', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const activated = await paramRepo.activateVersion(id);

    if (!activated) {
      return next(new NotFoundError(`Versión ${id} no encontrada`));
    }

    const adminUserId = String(req.user?.['userId'] ?? 'unknown');

    await auditLog({
      action:     'ACTIVATE_PARAMETER_VERSION',
      entity:     'PARAMETER_VERSION',
      entity_id:  id,
      actor_type: 'ADMIN',
      user_id:    adminUserId !== 'unknown' ? adminUserId : null,
      ip_address: extractIp(req),
      details:    { activatedVersionId: id },
    });

    res.json({ success: true, data: activated, message: 'Versión activada correctamente.' });
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
      levelConfigs?: { levelScope: string; isActive: boolean; validFrom: string; paymentCount: number; rateMonthly: number }[];
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
        if (!Number.isFinite(rule.minInitialPct) || rule.minInitialPct < 0 || rule.minInitialPct > 1) {
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
        if (!Number.isFinite(rule.initialPctRequired) || rule.initialPctRequired < 0 || rule.initialPctRequired > 1) {
          return next(new BadRequestError('initialPctRequired debe ser entre 0 y 1 (ej: 0.20 para 20%)'));
        }
      }
    }

    // ── Validación de levelConfigs ────────────────────────────
    if (body.levelConfigs !== undefined) {
      if (!Array.isArray(body.levelConfigs)) {
        return next(new BadRequestError('levelConfigs debe ser un arreglo'));
      }
      const validLevelsCfg = ['PREGRADO', 'POSGRADO', 'UPB_TEC'];
      for (const cfg of body.levelConfigs) {
        if (!validLevelsCfg.includes(cfg.levelScope)) {
          return next(new BadRequestError(`levelScope '${cfg.levelScope}' inválido en levelConfigs`));
        }
        if (typeof cfg.isActive !== 'boolean') {
          return next(new BadRequestError('isActive debe ser booleano en levelConfigs'));
        }
        if (!isValidDate(cfg.validFrom)) {
          return next(new BadRequestError('validFrom de levelConfig debe tener formato YYYY-MM-DD'));
        }
        if (!Number.isInteger(cfg.paymentCount) || cfg.paymentCount < 1 || cfg.paymentCount > 6) {
          return next(new BadRequestError('paymentCount en levelConfigs debe ser un entero entre 1 y 6'));
        }
        if (!Number.isFinite(cfg.rateMonthly) || cfg.rateMonthly < 0 || cfg.rateMonthly > 1) {
          return next(new BadRequestError('rateMonthly en levelConfigs debe ser entre 0 y 1'));
        }
      }
    }

    // ── Cargar versión actual: sirve para overlap check Y snapshot de auditoría ──
    const previous = await paramRepo.findById(id);
    if (!previous) {
      return next(new NotFoundError(`Versión de parámetros con id '${id}' no encontrada`));
    }

    // ── Verificación de superposición de vigencias ───────────
    if (body.validFrom !== undefined || body.validTo !== undefined) {
      const fromToCheck = body.validFrom ?? previous.validFrom;
      const toToCheck   = body.validTo !== undefined ? body.validTo : previous.validTo;

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
      ...(body.levelConfigs && {
        levelConfigs: body.levelConfigs.map(c => ({
          levelScope: c.levelScope as 'PREGRADO' | 'POSGRADO' | 'UPB_TEC',
          isActive: c.isActive,
          validFrom: c.validFrom,
          paymentCount: c.paymentCount,
          rateMonthly: c.rateMonthly,
        })),
      }),
    };

    const updated = await paramRepo.updateVersion(id, updateData);
    if (!updated) {
      return next(new NotFoundError(`Versión de parámetros con id '${id}' no encontrada`));
    }

    // ── Persistir registro de auditoría ─────────────────────────
    const adminUserId = String(req.user?.['userId'] ?? 'unknown');
    const adminEmail  = String(req.user?.['email']  ?? 'unknown');

    const changedFields: string[] = [];
    if (updateData.validFrom       !== undefined) changedFields.push('validFrom');
    if (updateData.validTo         !== undefined) changedFields.push('validTo');
    if (updateData.notes           !== undefined) changedFields.push('notes');
    if (updateData.interestRates   !== undefined) changedFields.push('interestRates');
    if (updateData.modalityRules   !== undefined) changedFields.push('modalityRules');
    if (updateData.initialPaymentRules !== undefined) changedFields.push('initialPaymentRules');
    if (updateData.levelConfigs    !== undefined) changedFields.push('levelConfigs');

    const changeSummary = changedFields.length > 0
      ? `Campos modificados: ${changedFields.join(', ')}`
      : 'Sin cambios';

    const ipAddress = extractIp(req);
    const auditUserId = adminUserId !== 'unknown' ? adminUserId : null;

    await auditLog({
      action:     'UPDATE_PARAMETER_VERSION',
      entity:     'PARAMETER_VERSION',
      entity_id:  id,
      actor_type: 'ADMIN',
      user_id:    auditUserId,
      ip_address: ipAddress,
      details:    {
        adminEmail,
        changeSummary,
        previousSnapshot: previous,
        newSnapshot:      updated,
      },
    });

    // Granular PARAMETER_RULE_UPDATED per rule type
    const ruleTypes = ['interestRates', 'modalityRules', 'initialPaymentRules'] as const;
    for (const ruleType of ruleTypes) {
      if (updateData[ruleType] !== undefined) {
        void auditLog({
          action:     'PARAMETER_RULE_UPDATED',
          entity:     'PARAMETER_VERSION',
          entity_id:  id,
          actor_type: 'ADMIN',
          user_id:    auditUserId,
          ip_address: ipAddress,
          details:    {
            adminEmail,
            ruleType,
            previousValue: (previous as unknown as Record<string, unknown>)[ruleType],
            newValue:      (updated  as unknown as Record<string, unknown>)[ruleType],
          },
        });
      }
    }

    // Detect if this version became the active one after the update
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
    const isNowActive = updated.validFrom <= today && (updated.validTo === null || updated.validTo >= today);
    const wasActive   = previous.validFrom <= today && (previous.validTo === null || previous.validTo >= today);
    if (isNowActive && !wasActive) {
      void auditLog({
        action:     'PARAMETER_VERSION_ACTIVATED',
        entity:     'PARAMETER_VERSION',
        entity_id:  id,
        actor_type: 'ADMIN',
        user_id:    auditUserId,
        ip_address: ipAddress,
        details:    { adminEmail, validFrom: updated.validFrom, validTo: updated.validTo },
      });
    }

    res.json({
      success: true,
      message: 'Parámetros actualizados correctamente. El cambio ha quedado registrado y aplicará a simulaciones futuras.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════════════════════
// HU-82: Gestión administrativa de usuarios
// ══════════════════════════════════════════════════════════════

const listUsersUseCase        = new ListUsersByAdminUseCase();
const getUserUseCase          = new GetUserByAdminUseCase(userRepo);
const updateUserUseCase       = new UpdateUserByAdminUseCase(userRepo);
const listUserSimsUseCase     = new ListUserSimulationsByAdminUseCase(userRepo, simulationRepo);
const getSimByIdAdminUseCase  = new GetSimulationByIdAdminUseCase(simulationRepo);

const VALID_FILTERS = new Set<UserFilterField>([
  'identificationNumber', 'documentType', 'fullName', 'email', 'phone', 'createdAt',
]);

/**
 * GET /api/admin/users
 * HU-82 + HU-PV-03: Lista estudiantes con búsqueda multi-criterio y paginación.
 * Query: criteria (JSON), q (texto legacy), filter (enum legacy), page, pageSize
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawPage     = Number.parseInt(String(req.query['page']     ?? '1'),  10);
    const rawPageSize = Number.parseInt(String(req.query['pageSize'] ?? '10'), 10);
    const q           = typeof req.query['q']      === 'string' ? req.query['q']      : undefined;
    const rawFilter   = typeof req.query['filter'] === 'string' ? req.query['filter'] : undefined;

    const filter: UserFilterField | undefined =
      rawFilter && VALID_FILTERS.has(rawFilter as UserFilterField)
        ? (rawFilter as UserFilterField)
        : undefined;

    // HU-PV-03: criterios multi-campo enviados como JSON
    let criteria: UserFilterCriterion[] | undefined;
    const rawCriteria = typeof req.query['criteria'] === 'string' ? req.query['criteria'] : undefined;
    if (rawCriteria) {
      try {
        const parsed: unknown = JSON.parse(rawCriteria);
        if (Array.isArray(parsed)) criteria = parsed as UserFilterCriterion[];
      } catch { /* criterios inválidos — ignorar */ }
    }

    const result = await listUsersUseCase.execute({
      criteria,
      q,
      filter,
      page:     Number.isNaN(rawPage)     ? 1  : rawPage,
      pageSize: Number.isNaN(rawPageSize) ? 10 : rawPageSize,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/export/csv
 * HU-PV-03: Exporta estudiantes filtrados como CSV (compatible con Excel).
 * Query: criteria (JSON), q (texto legacy), filter (enum legacy)
 * Exporta el conjunto completo filtrado, sin paginación.
 */
router.get('/users/export/csv', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUserId = req.user?.['userId'] as string | undefined;
    if (!adminUserId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const q         = typeof req.query['q']      === 'string' ? req.query['q']      : undefined;
    const rawFilter = typeof req.query['filter'] === 'string' ? req.query['filter'] : undefined;
    const filter: UserFilterField | undefined =
      rawFilter && VALID_FILTERS.has(rawFilter as UserFilterField)
        ? (rawFilter as UserFilterField)
        : undefined;

    let criteria: UserFilterCriterion[] | undefined;
    const rawCriteria = typeof req.query['criteria'] === 'string' ? req.query['criteria'] : undefined;
    if (rawCriteria) {
      try {
        const parsed: unknown = JSON.parse(rawCriteria);
        if (Array.isArray(parsed)) criteria = parsed as UserFilterCriterion[];
      } catch { /* ignorar */ }
    }

    // Traer todos los registros sin paginación (límite 5000 por seguridad)
    const result = await listUsersUseCase.execute({
      criteria,
      q,
      filter,
      page:     1,
      pageSize: 5000,
    });

    // Construir CSV con BOM UTF-8 para compatibilidad Excel
    const BOM = '\uFEFF';
    const headers = ['N° Documento', 'Tipo Doc.', 'Nombre Completo', 'Correo Electrónico', 'Número Celular', 'Fecha Registro'];
    const csvRows = result.items.map(u => [
      u.identificationNumber,
      u.documentType ?? '',
      u.fullName,
      u.email,
      u.phone ?? '',
      new Date(u.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csvContent = BOM + [headers.map(h => `"${h}"`).join(','), ...csvRows].join('\r\n');
    const csvBuffer  = Buffer.from(csvContent, 'utf-8');
    const filename   = `estudiantes-upb-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type',        'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length',      csvBuffer.length);
    res.send(csvBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:id
 * HU-82: Perfil completo de un usuario (sin password).
 */
router.get('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await getUserUseCase.execute(String(req.params['id'] ?? ''));
    if (!profile || (profile as { role?: string }).role !== 'STUDENT') {
      return next(new NotFoundError('Usuario no encontrado.'));
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id
 * HU-82: Actualiza campos permitidos del perfil de un usuario.
 */
router.patch(
  '/users/:id',
  validateRequest(UpdateUserByAdminInputSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user?.userId as string | undefined;
      if (!adminId) throw new UnauthorizedError('No se pudo identificar al administrador.');

      const targetUserId = String(req.params['id'] ?? '');
      const payload = req.body as ReturnType<typeof UpdateUserByAdminSchema.parse>;

      const before = await getUserUseCase.execute(targetUserId);
      if (!before || (before as { role?: string }).role !== 'STUDENT') {
        return next(new NotFoundError('Usuario no encontrado.'));
      }

      const updated = await updateUserUseCase.execute(targetUserId, payload);

      const changedFields = Object.keys(payload);
      await auditLog({
        action:     'ADMIN_USER_UPDATED',
        entity:     'USER',
        entity_id:  targetUserId,
        actor_type: 'ADMIN',
        user_id:    adminId,
        ip_address: extractIp(req),
        details: {
          admin_id:       adminId,
          target_user_id: targetUserId,
          changed_fields: changedFields,
          old_values: changedFields.reduce<Record<string, unknown>>((acc, f) => {
            acc[f] = (before as unknown as Record<string, unknown>)[f];
            return acc;
          }, {}),
          new_values: changedFields.reduce<Record<string, unknown>>((acc, f) => {
            acc[f] = (updated as unknown as Record<string, unknown>)[f];
            return acc;
          }, {}),
        },
      });

      res.json({ success: true, data: updated, message: 'Datos del estudiante actualizados correctamente.' });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/admin/users/:id/simulations
 * HU-82: Lista simulaciones de un usuario (máx. 50, desc. por fecha).
 */
router.get('/users/:id/simulations', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const simulations = await listUserSimsUseCase.execute(String(req.params['id'] ?? ''));
    res.json({ success: true, data: simulations });
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════════════════════
// HU-42: Gestión de simulaciones (ADMIN)
// ══════════════════════════════════════════════════════════════

type SimFilterField =
  | 'createdAt'
  | 'academicPeriod'
  | 'interestMode'
  | 'educationLevel'
  | 'studentType'
  | 'studentName'
  | 'studentEmail';

/** Criterio individual para filtros de simulaciones (HU-PV-03) */
interface SimFilterCriterion {
  field: SimFilterField;
  value: string;
  dateFrom?: string;
  dateTo?: string;
}

const VALID_SIM_FILTERS = new Set<SimFilterField>([
  'createdAt', 'academicPeriod', 'interestMode',
  'educationLevel', 'studentType', 'studentName', 'studentEmail',
]);

/** Divide un valor por ";" y devuelve términos no-vacíos */
function splitSimTerms(value: string): string[] {
  return value.split(';').map(v => v.trim()).filter(v => v.length > 0);
}

/**
 * Aplica criterios multi-campo sobre baseWhere y devuelve userIds a filtrar si aplica.
 * Retorna null si no necesita filtro por userIds, o un array de ids.
 */
async function applySimCriteria(
  criteria: SimFilterCriterion[],
  andConditions: Record<string, unknown>[],
): Promise<void> {
  for (const criterion of criteria) {
    const { field, value, dateFrom, dateTo } = criterion;

    if (field === 'createdAt') {
      const rangeCondition: Record<string, unknown> = {};
      if (dateFrom) rangeCondition[Op.gte as unknown as string] = `${dateFrom} 00:00:00`;
      if (dateTo)   rangeCondition[Op.lte as unknown as string] = `${dateTo} 23:59:59`;
      if (Object.keys(rangeCondition).length > 0) {
        andConditions.push({ created_at: rangeCondition });
      }
      continue;
    }

    if (field === 'studentName' || field === 'studentEmail') {
      const terms = splitSimTerms(value);
      if (terms.length === 0) continue;
      const userWhere: Record<string, unknown> = field === 'studentName'
        ? { [Op.or as unknown as string]: terms.flatMap(t => [
            { first_name: { [Op.like]: `%${t}%` } },
            { last_name:  { [Op.like]: `%${t}%` } },
          ])}
        : { [Op.or as unknown as string]: terms.map(t => ({ email: { [Op.like]: `%${t}%` } })) };

      const matchingUsers = await UserModel.findAll({ attributes: ['id'], where: userWhere });
      const ids = matchingUsers.map(u => u.id);
      andConditions.push({ user_id: { [Op.in]: ids } });
      continue;
    }

    const terms = splitSimTerms(value);
    if (terms.length === 0) continue;

    switch (field) {
      case 'academicPeriod':
        andConditions.push({
          [Op.or as unknown as string]: terms.map(t => ({ academic_period: { [Op.like]: `%${t}%` } })),
        });
        break;
      case 'interestMode': {
        // Mapear etiquetas amigables a valores BD
        const modalityValues = terms.flatMap(t => {
          const tl = t.toLowerCase();
          if (tl.includes('sin')) return ['SIN_INTERES'];
          if (tl.includes('con')) return ['CON_INTERES'];
          return [t.toUpperCase()];
        });
        andConditions.push({ modality: { [Op.in]: modalityValues } });
        break;
      }
      default:
        break;
    }
  }
}

/**
 * GET /api/admin/simulations
 * HU-42 + HU-PV-03: Lista paginada + filtrada de TODAS las simulaciones activas.
 * Query params: criteria (JSON), q, filter, page, pageSize
 */
router.get('/simulations', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q          = typeof req.query['q']      === 'string' ? req.query['q'].trim() : '';
    const rawFilter  = typeof req.query['filter'] === 'string' ? req.query['filter']   : '';
    const filter: SimFilterField | '' =
      rawFilter && VALID_SIM_FILTERS.has(rawFilter as SimFilterField)
        ? (rawFilter as SimFilterField)
        : '';

    const rawPage     = Number.parseInt(String(req.query['page']     ?? ''), 10);
    const rawPageSize = Number.parseInt(String(req.query['pageSize'] ?? ''), 10);
    const page     = Math.max(1, Number.isNaN(rawPage)     ? 1  : rawPage);
    const pageSize = Math.min(50, Math.max(1, Number.isNaN(rawPageSize) ? 10 : rawPageSize));
    const offset   = (page - 1) * pageSize;

    // HU-PV-03: criterios multi-campo
    let criteria: SimFilterCriterion[] | undefined;
    const rawCriteria = typeof req.query['criteria'] === 'string' ? req.query['criteria'] : undefined;
    if (rawCriteria) {
      try {
        const parsed: unknown = JSON.parse(rawCriteria);
        if (Array.isArray(parsed)) criteria = parsed as SimFilterCriterion[];
      } catch { /* ignorar */ }
    }

    // Condición base: no eliminadas
    const andConditions: Record<string, unknown>[] = [{ deleted_at: null }];

    if (criteria && criteria.length > 0) {
      // Modo multi-criterio
      await applySimCriteria(criteria, andConditions);
    } else if (q) {
      // Modo legacy: un solo campo
      const qLike = `%${q}%`;
      if (filter === 'studentName' || filter === 'studentEmail') {
        const userWhere = filter === 'studentName'
          ? { [Op.or]: [
              { first_name: { [Op.like]: qLike } },
              { last_name:  { [Op.like]: qLike } },
            ]}
          : { email: { [Op.like]: qLike } };
        const matchingUsers = await UserModel.findAll({ attributes: ['id'], where: userWhere });
        andConditions.push({ user_id: { [Op.in]: matchingUsers.map(u => u.id) } });
      } else {
        switch (filter) {
          case 'createdAt':       andConditions.push({ created_at:      { [Op.like]: qLike } }); break;
          case 'academicPeriod':  andConditions.push({ academic_period: { [Op.like]: qLike } }); break;
          case 'interestMode':    andConditions.push({ modality:        { [Op.like]: qLike } }); break;
          case 'educationLevel':  andConditions.push({ level:           { [Op.like]: qLike } }); break;
          case 'studentType':     andConditions.push({ student_type:    { [Op.like]: qLike } }); break;
          default:
            andConditions.push({ [Op.or as unknown as string]: [
              { modality:        { [Op.like]: qLike } },
              { academic_period: { [Op.like]: qLike } },
              { level:           { [Op.like]: qLike } },
              { student_type:    { [Op.like]: qLike } },
            ]});
        }
      }
    }

    const where = { [Op.and as unknown as string]: andConditions };

    const { count, rows } = await SimulationModel.findAndCountAll({
      where,
      attributes: [
        'id', 'created_at', 'modality', 'level', 'student_type',
        'financed_value', 'initial_payment_value', 'first_payment_date',
        'total_payments', 'academic_period', 'user_id',
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    const userIds = [...new Set(rows.map(r => r.user_id))];
    const users = await UserModel.findAll({
      attributes: ['id', 'first_name', 'last_name', 'email'],
      where: { id: { [Op.in]: userIds } },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const items = rows.map(sim => {
      const u = userMap.get(sim.user_id);
      return {
        id:                  sim.id,
        createdAt:           sim.created_at,
        studentName:         u ? `${u.first_name} ${u.last_name}`.trim() : '',
        studentEmail:        u?.email ?? '',
        modality:            sim.modality,
        educationLevel:      sim.level,
        studentType:         sim.student_type,
        financedValue:       Number(sim.financed_value),
        initialPaymentValue: Number(sim.initial_payment_value),
        firstPaymentDate:    sim.first_payment_date,
        numberOfPayments:    sim.total_payments,
        academicPeriod:      sim.academic_period ?? '',
      };
    });

    res.json({
      success: true,
      data: {
        items,
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════════════════════
// HU-43: Detalle de una simulación (ADMIN)
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/simulations/:id
 * HU-43: Retorna el detalle completo de una simulación con datos del estudiante.
 */
router.get('/simulations/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const simId = req.params['id'] as string;
    const simulation = await getSimByIdAdminUseCase.execute(simId);
    res.json({ success: true, data: simulation });
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════════════════════
// HU-38: Eliminación administrativa de simulaciones
// ══════════════════════════════════════════════════════════════

/**
 * DELETE /api/admin/simulations/:id
 * Soft-delete administrativo de una simulación.
 * Solo accesible por ADMIN (protegido por roleGuard).
 * Registra SIMULATION_DELETED en auditoría con ip_address del admin.
 */
router.delete('/simulations/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUserId = req.user?.['userId'] as string | undefined;
    if (!adminUserId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const simId = req.params['id'] as string;
    const body = req.body as { reason?: unknown };
    const defaultReason = 'Eliminado por administrador';
    let reason: string;
    if (body.reason === undefined || body.reason === null) {
      reason = defaultReason;
    } else if (typeof body.reason !== 'string') {
      res.status(400).json({ error: 'El campo "reason" debe ser un string.' });
      return;
    } else {
      const trimmed = body.reason.trim();
      reason = trimmed.length === 0 ? defaultReason : trimmed;
      if (reason.length > 255) reason = reason.slice(0, 255);
    }

    // Obtener datos de la simulación antes del soft-delete para la auditoría
    const simRecord = await SimulationModel.findOne({
      attributes: ['user_id', 'modality', 'level', 'financed_value'],
      where: { id: simId, deleted_at: null },
    });

    const deleted = await simulationRepo.softDelete(simId, adminUserId, reason);
    if (!deleted) {
      res.status(404).json({ error: 'Simulación no encontrada o ya eliminada.' });
      return;
    }

    await auditLog({
      action:     'SIMULATION_DELETED',
      entity:     'SIMULATION',
      entity_id:  simId,
      actor_type: 'ADMIN',
      user_id:    adminUserId,
      ip_address: extractIp(req),
      details:    {
        simulation_id:   simId,
        affected_user_id: simRecord?.user_id ?? null,
        reason,
        previous_status: 'ACTIVE',
        modality:        simRecord?.modality ?? null,
        level:           simRecord?.level ?? null,
        financed_value:  simRecord ? Number(simRecord.financed_value) : null,
      },
    });

    res.json({ success: true, message: 'Simulación eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════════════════════
// HU-40 / HU-41: Exportar simulación (ADMIN) — PDF y CSV
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/simulations/:id/export/pdf
 * HU-40: Genera y descarga el PDF de una simulación.
 */
router.get('/simulations/:id/export/pdf', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUserId = req.user?.['userId'] as string | undefined;
    if (!adminUserId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const simId = String(req.params['id'] ?? '').trim();
    if (!simId) {
      res.status(400).json({ error: 'ID de simulación requerido.' });
      return;
    }

    const simulation = await getSimByIdAdminUseCase.execute(simId);

    const pdfBuffer = await buildSimulationPdf(simulation);

    let safeName = `${simulation.student.firstName} ${simulation.student.lastName}`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-');
    if (!safeName) safeName = 'estudiante';
    let safeId = String(simulation.student.identificationNumber ?? '').replace(/[^a-zA-Z0-9]/g, '');
    if (!safeId) safeId = simId.slice(0, 8);
    const filename = `simulacion-upb-${safeName}-${safeId}.pdf`;

    const pdfContentFlags = { summary: true, amortizationTable: true, charts: true };

    // Registrar en export_logs (HU-40)
    void ExportLogModel.create({
      format:        'PDF',
      simulation_id: simId,
      user_id:       adminUserId,
      ip_address:    extractIp(req) ?? null,
      file_name:     filename,
      content_flags: JSON.stringify(pdfContentFlags),
    }).catch((err: unknown) => {
      logger.warn('Failed to persist export log', { error: err, simulation_id: simId, format: 'PDF', user_id: adminUserId });
    });

    void auditLog({
      action:     'SIMULATION_EXPORTED_PDF',
      entity:     'SIMULATION',
      entity_id:  simId,
      actor_type: 'ADMIN',
      user_id:    adminUserId,
      ip_address: extractIp(req),
      details:    {
        simulation_id:              simId,
        format:                     'PDF',
        include_summary:            pdfContentFlags.summary,
        include_amortization_table: pdfContentFlags.amortizationTable,
        include_charts:             pdfContentFlags.charts,
        file_name:                  filename,
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
 * GET /api/admin/simulations/:id/export/csv
 * HU-41: Genera y descarga el CSV de una simulación.
 */
router.get('/simulations/:id/export/csv', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUserId = req.user?.['userId'] as string | undefined;
    if (!adminUserId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const simId = String(req.params['id'] ?? '').trim();
    if (!simId) {
      res.status(400).json({ error: 'ID de simulación requerido.' });
      return;
    }

    const simulation = await getSimByIdAdminUseCase.execute(simId);

    const csvContent = buildSimulationCsv(simulation);
    const csvBuffer  = Buffer.from(csvContent, 'utf-8');

    let safeName = `${simulation.student.firstName} ${simulation.student.lastName}`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-');
    if (!safeName) safeName = 'estudiante';
    let safeId = String(simulation.student.identificationNumber ?? '').replace(/[^a-zA-Z0-9]/g, '');
    if (!safeId) safeId = simId.slice(0, 8);
    const filename = `simulacion-upb-${safeName}-${safeId}.csv`;

    const csvContentFlags = { summary: true, amortizationTable: true };

    // Registrar en export_logs (HU-41)
    void ExportLogModel.create({
      format:        'CSV',
      simulation_id: simId,
      user_id:       adminUserId,
      ip_address:    extractIp(req) ?? null,
      file_name:     filename,
      content_flags: JSON.stringify(csvContentFlags),
    }).catch((err: unknown) => {
      logger.warn('Failed to persist export log', { error: err, simulation_id: simId, format: 'CSV', user_id: adminUserId });
    });

    void auditLog({
      action:     'SIMULATION_EXPORTED_CSV',
      entity:     'SIMULATION',
      entity_id:  simId,
      actor_type: 'ADMIN',
      user_id:    adminUserId,
      ip_address: extractIp(req),
      details:    {
        simulation_id:              simId,
        format:                     'CSV',
        include_summary:            csvContentFlags.summary,
        include_amortization_table: csvContentFlags.amortizationTable,
        file_name:                  filename,
      },
    });

    res.setHeader('Content-Type',        'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length',      csvBuffer.length);
    res.send(csvBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;
