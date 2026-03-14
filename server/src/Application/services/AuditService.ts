// ============================================================
// Service: AuditService
// Centraliza la creación de registros de auditoría en audit_logs.
// Usado transversalmente desde rutas, middlewares y use-cases.
// ============================================================

import { AuditLogModel } from '../../Infrastructure/persistence/models/AuditLogModel';
import { logger } from '../../Infrastructure/logger';
import type { Transaction } from 'sequelize';

export type ActorType = 'ADMIN' | 'STUDENT' | 'SYSTEM';

export interface AuditEntry {
  action: string;
  entity: string;
  entity_id: string;
  actor_type: ActorType;
  user_id?: string | null;
  ip_address?: string | null;
  details: Record<string, unknown>;
  transaction?: Transaction;
}

/**
 * Registra un evento de auditoría en la tabla audit_logs.
 * Nunca lanza excepciones — los fallos se registran en el logger.
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await AuditLogModel.create(
      {
        action:     entry.action,
        entity:     entry.entity,
        entity_id:  entry.entity_id,
        actor_type: entry.actor_type,
        user_id:    entry.user_id ?? null,
        ip_address: entry.ip_address ?? null,
        details:    JSON.stringify(entry.details),
      },
      entry.transaction ? { transaction: entry.transaction } : undefined,
    );
  } catch (error) {
    logger.error('No se pudo persistir el registro de auditoría', {
      error: error instanceof Error ? error.message : 'Unknown',
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id,
    });
  }
}

/**
 * Extrae la IP del request de Express de forma segura.
 */
export function extractIp(req: { ip?: string; socket?: { remoteAddress?: string } }): string | null {
  return req.ip ?? req.socket?.remoteAddress ?? null;
}
