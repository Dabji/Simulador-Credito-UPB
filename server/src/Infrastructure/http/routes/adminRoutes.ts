// ============================================================
// Express Routes: Admin — Parámetros Financieros (RF-10, RF-23, RF-24)
// y Gestión de Usuarios (HU-82).
// Todos los endpoints bajo /api/admin → protegidos por authGuard + roleGuard(ADMIN).
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { SequelizeParameterVersionRepository } from '../../persistence/repositories/SequelizeParameterVersionRepository';
import { SequelizeUserRepository } from '../../persistence/repositories/SequelizeUserRepository';
import { SequelizeSimulationRepository } from '../../persistence/repositories/SequelizeSimulationRepository';
import { User, UserRole } from '../../../Core/entities/User';
import { BadRequestError, NotFoundError } from '../../../Core/errors';
import type { UpdateParameterVersionData } from '../../../Core/repositories/IParameterVersionRepository';
import { AuditLogModel } from '../../persistence/models/AuditLogModel';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
import { auditLog, extractIp } from '../../../Application/services/AuditService';

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

/**
 * GET /api/admin/users
 * Lista usuarios registrados con paginación (?limit=50&offset=0).
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let limit  = Math.max(1, parseInt(req.query['limit']  as string, 10) || 50);
    let offset = Math.max(0, parseInt(req.query['offset'] as string, 10) || 0);
    if (limit > 100) limit = 100;

    const { rows: users, count: total } = await userRepo.findAll({ limit, offset });
    res.json({
      success: true,
      data: {
        total,
        limit,
        offset,
        users: users.map(u => {
          const { password: _, ...safe } = u.toJSON();
          void _;
          return safe;
        }),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:id
 * Detalle de un usuario específico.
 */
router.get('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userRepo.findById(req.params['id'] as string);
    if (!user) return next(new NotFoundError('Usuario no encontrado'));
    const { password: _, ...safe } = user.toJSON();
    void _;
    res.json({ success: true, data: safe });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id
 * HU-82: Actualiza información de un usuario (nombre, teléfono, estado, rol).
 * Genera audit logs diferenciados:
 *   - ADMIN_USER_STATUS_CHANGED cuando cambia is_active
 *   - ADMIN_USER_ROLE_CHANGED  cuando cambia role
 *   - ADMIN_USER_UPDATED       para cualquier otro cambio de datos
 */
router.patch('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = req.params['id'] as string;
    const body = req.body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      isActive?: boolean;
      role?: string;
    };

    // Validar role si viene en el body
    const VALID_ROLES = ['ADMIN', 'STUDENT'];
    if (body.role !== undefined && !VALID_ROLES.includes(body.role)) {
      return next(new BadRequestError(`Rol inválido: ${body.role}. Valores permitidos: ${VALID_ROLES.join(', ')}`));
    }

    const existing = await userRepo.findById(targetId);
    if (!existing) return next(new NotFoundError('Usuario no encontrado'));

    const adminUserId = String(req.user?.['userId'] ?? 'unknown');
    const adminEmail  = String(req.user?.['email']  ?? 'unknown');
    const ipAddress   = extractIp(req);
    const auditUserId = adminUserId !== 'unknown' ? adminUserId : null;

    // Build updated user
    const existingJson = existing.toJSON();
    const updatedUser = User.reconstitute({
      ...existingJson,
      firstName: body.firstName ?? existingJson.firstName,
      lastName:  body.lastName  ?? existingJson.lastName,
      phone:     body.phone     ?? existingJson.phone,
      isActive:  body.isActive  ?? existingJson.isActive,
      role:      (body.role === 'ADMIN' ? UserRole.ADMIN : body.role === 'STUDENT' ? UserRole.STUDENT : existingJson.role),
      updatedAt: new Date(),
    });

    const saved = await userRepo.update(updatedUser);

    // Audit: status change
    if (body.isActive !== undefined && body.isActive !== existingJson.isActive) {
      await auditLog({
        action:     'ADMIN_USER_STATUS_CHANGED',
        entity:     'USER',
        entity_id:  targetId,
        actor_type: 'ADMIN',
        user_id:    auditUserId,
        ip_address: ipAddress,
        details:    {
          adminEmail,
          targetUserId: targetId,
          targetEmail:  existingJson.email,
          previousStatus: existingJson.isActive,
          newStatus:      body.isActive,
        },
      });
    }

    // Audit: role change (compare against persisted role to avoid inconsistent logs)
    const savedJson = saved.toJSON();
    if (savedJson.role !== existingJson.role) {
      await auditLog({
        action:     'ADMIN_USER_ROLE_CHANGED',
        entity:     'USER',
        entity_id:  targetId,
        actor_type: 'ADMIN',
        user_id:    auditUserId,
        ip_address: ipAddress,
        details:    {
          adminEmail,
          targetUserId: targetId,
          targetEmail:  existingJson.email,
          previousRole: existingJson.role,
          newRole:      savedJson.role,
        },
      });
    }

    // Audit: general data update (only if non-status/role fields changed)
    const dataFields = ['firstName', 'lastName', 'phone'] as const;
    const changedData = dataFields.filter(f => body[f] !== undefined && body[f] !== (existingJson as unknown as Record<string, unknown>)[f]);
    if (changedData.length > 0) {
      await auditLog({
        action:     'ADMIN_USER_UPDATED',
        entity:     'USER',
        entity_id:  targetId,
        actor_type: 'ADMIN',
        user_id:    auditUserId,
        ip_address: ipAddress,
        details:    {
          adminEmail,
          targetUserId: targetId,
          targetEmail:  existingJson.email,
          changedFields: changedData,
        },
      });
    }

    const { password: _, ...safeResult } = saved.toJSON();
    void _;
    res.json({ success: true, data: safeResult, message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════════════════════
// Eliminación administrativa de simulaciones
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
      details:    { simulation_id: simId, reason },
    });

    res.json({ success: true, message: 'Simulación eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
});

export default router;
