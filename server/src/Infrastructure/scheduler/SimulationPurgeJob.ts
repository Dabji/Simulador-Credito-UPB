// ============================================================
// Scheduler: SimulationPurgeJob
// Purga automática de simulaciones con más de 90 días.
// Reemplaza el MySQL EVENT (evt_purge_old_simulations) que no
// se puede crear en Aiven Cloud por restricción de privilegios
// (SUPER / SYSTEM_VARIABLES_ADMIN / event_scheduler).
//
// Estrategia:
//   - setInterval ejecuta la purga una vez al día.
//   - Soft-delete: marca deleted_at + delete_reason, sin borrar
//     físicamente los datos de la BD.
//   - La auditoría se registra vía AuditService.ts con
//     actor_type = 'SYSTEM' para cada simulación purgada.
// ============================================================

import { SimulationModel } from '../persistence/models/SimulationModel';
import { logger } from '../logger';
import { auditLog } from '../../Application/services/AuditService';
import { Op, literal } from 'sequelize';

const RETENTION_DAYS = 90;
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
const PURGE_REASON = 'PURGA_AUTOMATICA_RETENCION_90_DIAS';

let intervalRef: ReturnType<typeof setInterval> | null = null;

/**
 * Ejecuta la purga de simulaciones que superan el período de retención.
 * Soft-delete: establece deleted_at y delete_reason sin eliminar datos.
 * Registra auditoría con actor_type = 'SYSTEM' para cada simulación purgada.
 */
export async function purgeExpiredSimulations(): Promise<number> {
  try {
    const expiredCondition = {
      deleted_at: null,
      saved_at: { [Op.lte]: literal(`NOW() - INTERVAL ${RETENTION_DAYS} DAY`) },
    };

    // Obtener IDs antes de actualizar (para auditoría individual)
    const expired = await SimulationModel.findAll({
      attributes: ['id'],
      where: expiredCondition,
    });

    if (expired.length === 0) {
      logger.debug('Purga automática: no hay simulaciones que superen el período de retención');
      return 0;
    }

    const expiredIds = expired.map(s => s.id);

    const [affectedRows] = await SimulationModel.update(
      {
        deleted_at: new Date(),
        deleted_by: null,
        delete_reason: PURGE_REASON,
      },
      { where: { id: { [Op.in]: expiredIds } } },
    );

    logger.info(`Purga automática: ${affectedRows} simulación(es) archivada(s) por superar ${RETENTION_DAYS} días`, {
      affectedRows,
      retentionDays: RETENTION_DAYS,
    });

    // Registrar auditoría para cada simulación purgada
    for (const simId of expiredIds) {
      void auditLog({
        action:     'SIMULATION_DELETED',
        entity:     'SIMULATION',
        entity_id:  simId,
        actor_type: 'SYSTEM',
        user_id:    null,
        details:    { simulation_id: simId, reason: PURGE_REASON },
      });
    }

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
 * Ejecuta inmediatamente al arrancar y luego cada 24 horas.
 */
export function startPurgeScheduler(): void {
  if (intervalRef) {
    logger.warn('El scheduler de purga ya está corriendo, se omite re-inicio');
    return;
  }

  logger.info(`Scheduler de purga iniciado (cada ${RETENTION_DAYS} días de retención, ciclo cada 24h)`);

  // Ejecución inicial diferida 30s para no bloquear el arranque
  setTimeout(() => {
    void purgeExpiredSimulations();
  }, 30_000);

  intervalRef = setInterval(() => {
    void purgeExpiredSimulations();
  }, INTERVAL_MS);

  // No impedir que el proceso termine si solo queda el interval
  if (intervalRef && typeof intervalRef === 'object' && 'unref' in intervalRef) {
    intervalRef.unref();
  }
}

/**
 * Detiene el scheduler de purga (útil para tests y shutdown).
 */
export function stopPurgeScheduler(): void {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
    logger.info('Scheduler de purga detenido');
  }
}
