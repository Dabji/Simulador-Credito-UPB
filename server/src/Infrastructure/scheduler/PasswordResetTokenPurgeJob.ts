// ============================================================
// Scheduler: PasswordResetTokenPurgeJob
// Purga física de password_reset_tokens con expires_at
// más antiguo que TOKEN_PURGE_RETENTION_DAYS días (default 30).
//
// Decisión de diseño:
//   - Se eliminan registros cuyo expires_at < NOW() - INTERVAL N DAY.
//   - No se filtra por used_at: tanto tokens usados como abandonados
//     pierden valor operativo pasada la ventana de retención.
//   - Se usa expires_at (no created_at) porque es el límite semántico
//     correcto de vida útil del token.
//   - DELETE físico (no soft-delete): la tabla no tiene deleted_at
//     y los tokens expirados no tienen valor de negocio. La trazabilidad
//     funcional principal vive en audit_logs (PASSWORD_RESET_REQUESTED,
//     PASSWORD_RESET_COMPLETED, PASSWORD_RESET_TOKEN_EXPIRED, etc.).
//   - La purga se hace en lotes (LIMIT) con loop hasta agotar candidatos,
//     para acotar el tiempo de cada ciclo y respetar el índice idx_prt_expires.
//
// ⚠️  Advertencia multi-instancia:
//   En entorno single-instance (actual) está bien — un solo scheduler
//   por proceso Node.js. Si en el futuro el backend corre en múltiples
//   instancias (PM2 cluster, Docker replicas, etc.), cada instancia
//   lanzará este job de forma independiente. El DELETE con LIMIT es
//   idempotente y no corrompe datos, pero genera carga duplicada sobre
//   la BD. Solución futura recomendada: mutex distribuido (Redis) o
//   cron externo (MySQL Event Scheduler / cron job del SO).
// ============================================================

import { QueryTypes } from 'sequelize';
import { Database } from '../config/database';
import { logger } from '../logger';
import { env } from '../config/env';

let intervalRef: ReturnType<typeof setInterval> | null = null;
let timeoutRef: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;

/**
 * Ejecuta la purga física de tokens expirados hace más de
 * TOKEN_PURGE_RETENTION_DAYS días.
 *
 * Procesa en lotes de TOKEN_PURGE_BATCH_SIZE filas por ciclo,
 * repitiendo hasta que un lote elimine menos filas que el batch size
 * (señal de que ya no quedan más candidatos).
 *
 * Retorna el total de filas eliminadas en todos los lotes.
 */
export async function purgeExpiredTokens(): Promise<number> {
  const retentionDays = env.TOKEN_PURGE_RETENTION_DAYS;
  const batchSize     = env.TOKEN_PURGE_BATCH_SIZE;

  if (isRunning) {
    logger.warn('Token purge: ejecución anterior aún en curso, se omite este ciclo');
    return 0;
  }

  const sequelize = Database.getInstance().getSequelize();

  let totalDeleted = 0;
  let batchNumber  = 0;
  isRunning = true;

  try {
    while (true) {
      batchNumber++;

      const [, meta] = await sequelize.query(
        `DELETE FROM password_reset_tokens
         WHERE expires_at < NOW() - INTERVAL :retentionDays DAY
         ORDER BY expires_at
         LIMIT :batchSize`,
        {
          replacements: { retentionDays, batchSize },
          type: QueryTypes.RAW,
        },
      );

      const deleted = typeof meta === 'number'
        ? meta
        : (meta as unknown as { affectedRows?: number }).affectedRows ?? 0;
      totalDeleted += deleted;

      logger.info(
        `Token purge batch #${batchNumber}: ${deleted} token(s) eliminado(s)` +
        ` (retención: ${retentionDays} días, batch size: ${batchSize})`,
        { batch: batchNumber, deleted, retentionDays, batchSize },
      );

      if (deleted < batchSize) {
        break;
      }
    }

    if (totalDeleted > 0) {
      logger.info(
        `Token purge completada: ${totalDeleted} token(s) eliminado(s) en ${batchNumber} lote(s)`,
        { totalDeleted, batches: batchNumber, retentionDays },
      );
    } else {
      logger.debug('Token purge: no hay tokens expirados que superen el período de retención');
    }

    return totalDeleted;
  } catch (error) {
    logger.error('Error en purga automática de password_reset_tokens', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      retentionDays,
      batchSize,
    });
    return 0;
  } finally {
    isRunning = false;
  }
}

/**
 * Inicia el job periódico de purga de tokens.
 * Ejecuta con una demora inicial de 60s para no solapar con
 * SimulationPurgeJob (que arranca a los 30s).
 */
export function startTokenPurgeScheduler(): void {
  if (intervalRef) {
    logger.warn('El scheduler de purga de tokens ya está corriendo, se omite re-inicio');
    return;
  }

  const retentionDays = env.TOKEN_PURGE_RETENTION_DAYS;
  const intervalHours = env.TOKEN_PURGE_INTERVAL_HOURS;
  const batchSize     = env.TOKEN_PURGE_BATCH_SIZE;
  const intervalMs    = intervalHours * 60 * 60 * 1000;

  logger.info(
    `Scheduler de purga de tokens iniciado` +
    ` (retención: ${retentionDays} días, ciclo cada ${intervalHours}h, batch: ${batchSize})`,
  );

  timeoutRef = setTimeout(() => {
    void purgeExpiredTokens();
  }, 60_000);

  intervalRef = setInterval(() => {
    void purgeExpiredTokens();
  }, intervalMs);

  if (timeoutRef && typeof timeoutRef === 'object' && 'unref' in timeoutRef) {
    timeoutRef.unref();
  }
  if (intervalRef && typeof intervalRef === 'object' && 'unref' in intervalRef) {
    intervalRef.unref();
  }
}

/**
 * Detiene el scheduler de purga de tokens (útil para tests y shutdown).
 */
export function stopTokenPurgeScheduler(): void {
  if (timeoutRef) {
    clearTimeout(timeoutRef);
    timeoutRef = null;
  }
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
  if (!timeoutRef && !intervalRef) {
    logger.info('Scheduler de purga de tokens detenido');
  }
}
