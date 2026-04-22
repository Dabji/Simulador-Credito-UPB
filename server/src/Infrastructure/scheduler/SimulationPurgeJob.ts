// ============================================================
// Scheduler: SimulationPurgeJob
// Purga automática de simulaciones que superan el umbral de
// retención configurado (env: RETENTION_DAYS, default 90).
// Reemplaza el MySQL EVENT (evt_purge_old_simulations) que no
// se puede crear en Aiven Cloud por restricción de privilegios
// (SUPER / SYSTEM_VARIABLES_ADMIN / event_scheduler).
//
// Estrategia:
//   - setInterval ejecuta la purga periódicamente (env: PURGE_INTERVAL_HOURS).
//   - Cada ciclo procesa como máximo PURGE_BATCH_SIZE simulaciones
//     para acotar el tiempo de ejecución y carga sobre la BD.
//   - Soft-delete: marca deleted_at + delete_reason, sin borrar
//     físicamente los datos de la BD.
//   - La auditoría individual se registra vía AuditService.ts con
//     actor_type = 'SYSTEM' para cada simulación purgada.
//   - Al finalizar cada ciclo se registra un evento agregado
//     SIMULATION_PURGE_COMPLETED para visibilidad en el panel de administración.
// ============================================================

import { SimulationModel } from '../persistence/models/SimulationModel';
import { SequelizeSimulationRepository } from '../persistence/repositories/SequelizeSimulationRepository';
import { auditLog } from '../../Application/services/AuditService';
import { logger } from '../logger';
import { env } from '../config/env';
import { Op, literal } from 'sequelize';

const simulationRepo = new SequelizeSimulationRepository();
let intervalRef: ReturnType<typeof setInterval> | null = null;
let timeoutRef: ReturnType<typeof setTimeout> | null = null;

/**
 * Ejecuta la purga de simulaciones que superan el período de retención.
 * Reutiliza softDelete(id, null, reason) del repositorio, que:
 *   - Aplica soft-delete con deleted_at: null en el WHERE (race-condition safe).
 *   - Registra auditoría SIMULATION_DELETED con actor_type = 'SYSTEM'.
 *
 * Procesa un máximo de PURGE_BATCH_SIZE registros por ciclo para
 * evitar operaciones excesivamente largas en la BD.
 */
export async function purgeExpiredSimulations(): Promise<number> {
  const retentionDays = env.RETENTION_DAYS;
  const batchSize     = env.PURGE_BATCH_SIZE;
  const purgeReason   = `PURGA_AUTOMATICA_RETENCION_${retentionDays}_DIAS`;

  try {
    // Obtener IDs de simulaciones expiradas (aún no eliminadas), acotados al batch
    const expired = await SimulationModel.findAll({
      attributes: ['id'],
      where: {
        deleted_at: null,
        created_at: { [Op.lte]: literal(`NOW() - INTERVAL ${retentionDays} DAY`) },
      },
      limit: batchSize,
    });

    if (expired.length === 0) {
      logger.debug('Purga automática: no hay simulaciones que superen el período de retención');
      return 0;
    }

    let affectedRows = 0;
    for (const sim of expired) {
      const deleted = await simulationRepo.softDelete(sim.id, null, purgeReason);
      if (deleted) affectedRows++;
    }

    logger.info(`Purga automática: ${affectedRows} simulación(es) archivada(s) por superar ${retentionDays} días`, {
      affectedRows,
      retentionDays,
      batchSize,
      candidatesFound: expired.length,
    });

    const purgedAt = new Date().toISOString();

    // Evento agregado de auditoría para visibilidad administrativa (HU-39)
    void auditLog({
      action:     'SIMULATION_PURGE_COMPLETED',
      entity:     'SIMULATION_PURGE',
      entity_id:  purgeReason,
      actor_type: 'SYSTEM',
      user_id:    null,
      details: {
        reason:          purgeReason,
        threshold_days:  retentionDays,
        total_affected:  affectedRows,
        purged_at:       purgedAt,
        simulation_ids:  expired.map(s => s.id),
      },
    });

    return affectedRows;
  } catch (error) {
    logger.error('Error en purga automática de simulaciones', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return 0;
  }
}

/**
 * Inicia el job periódico de purga.
 * Ejecuta inmediatamente al arrancar y luego cada PURGE_INTERVAL_HOURS horas.
 */
export function startPurgeScheduler(): void {
  if (intervalRef) {
    logger.warn('El scheduler de purga ya está corriendo, se omite re-inicio');
    return;
  }

  const retentionDays = env.RETENTION_DAYS;
  const intervalHours = env.PURGE_INTERVAL_HOURS;
  const intervalMs    = intervalHours * 60 * 60 * 1000;

  logger.info(`Scheduler de purga iniciado (retención: ${retentionDays} días, ciclo cada ${intervalHours}h, batch: ${env.PURGE_BATCH_SIZE})`);

  // Ejecución inicial diferida 30s para no bloquear el arranque
  timeoutRef = setTimeout(() => {
    void purgeExpiredSimulations();
  }, 30_000);

  intervalRef = setInterval(() => {
    void purgeExpiredSimulations();
  }, intervalMs);

  // No impedir que el proceso termine si solo queda el timeout/interval
  if (timeoutRef && typeof timeoutRef === 'object' && 'unref' in timeoutRef) {
    timeoutRef.unref();
  }
  if (intervalRef && typeof intervalRef === 'object' && 'unref' in intervalRef) {
    intervalRef.unref();
  }
}

/**
 * Detiene el scheduler de purga (útil para tests y shutdown).
 */
export function stopPurgeScheduler(): void {
  if (timeoutRef) {
    clearTimeout(timeoutRef);
    timeoutRef = null;
  }
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
  if (!timeoutRef && !intervalRef) {
    logger.info('Scheduler de purga detenido');
  }
}
