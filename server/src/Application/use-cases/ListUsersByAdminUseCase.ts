// ============================================================
// Use Case: ListUsersByAdminUseCase (HU-82 + HU-PV-03)
// Lista usuarios con paginación y búsqueda multi-criterio.
// Cada campo soporta múltiples valores separados por ";" (OR).
// Distintos campos se combinan con AND.
// Solo accesible por ADMIN.
// ============================================================

import { Op } from 'sequelize';
import { UserModel } from '../../Infrastructure/persistence/models/UserModel';
import type { AdminUserListItemOutput } from '../dtos/AdminUserListItemOutput';
import type { DocumentType } from '../../Core/entities/User';

export type UserFilterField =
  | 'identificationNumber'
  | 'documentType'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'createdAt';

/** Criterio individual de filtro */
export interface UserFilterCriterion {
  field: UserFilterField;
  /** Texto libre; múltiples valores se separan con ";" → OR */
  value: string;
  /** Solo para createdAt: fecha ISO YYYY-MM-DD de inicio del rango */
  dateFrom?: string;
  /** Solo para createdAt: fecha ISO YYYY-MM-DD de fin del rango */
  dateTo?: string;
}

export interface ListUsersParams {
  /** Criterios multi-campo (HU-PV-03). Si se envía, sustituye q+filter. */
  criteria?: UserFilterCriterion[];
  /** Compatibilidad legacy: búsqueda simple de un solo campo */
  q?: string;
  filter?: UserFilterField;
  page?: number;
  pageSize?: number;
  /** Modo exportación: bypasea el cap de pageSize (máx UI = 50) para traer todos los registros */
  forExport?: boolean;
}

export interface ListUsersResult {
  items: AdminUserListItemOutput[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Divide un valor por ";" y devuelve términos no-vacíos */
function splitTerms(value: string): string[] {
  return value.split(';').map(v => v.trim()).filter(v => v.length > 0);
}

/** Construye condición OR para LIKE de múltiples términos sobre una columna */
function likeOr(col: string, terms: string[]): Record<string, unknown>[] {
  return terms.map(t => ({ [col]: { [Op.like]: `%${t}%` } }));
}

export class ListUsersByAdminUseCase {
  async execute(params: ListUsersParams): Promise<ListUsersResult> {
    const page     = Math.max(1, params.page     ?? 1);
    const maxSize  = params.forExport ? 5000 : 50;
    const pageSize = Math.min(Math.max(1, params.pageSize ?? 10), maxSize);
    const offset   = (page - 1) * pageSize;

    // Condición base
    const andConditions: Record<string, unknown>[] = [{ role: 'STUDENT' }];

    if (params.criteria && params.criteria.length > 0) {
      // ── Modo multi-criterio (HU-PV-03) ──────────────────────
      for (const criterion of params.criteria) {
        if (!criterion || typeof criterion !== 'object') continue;
        const { field, value, dateFrom, dateTo } = criterion;
        if (typeof field !== 'string') continue;

        if (field === 'createdAt') {
          // Rango de fechas
          if (dateFrom || dateTo) {
            const rangeCondition: Record<symbol, string> = {};
            if (dateFrom) rangeCondition[Op.gte] = `${dateFrom} 00:00:00`;
            if (dateTo)   rangeCondition[Op.lte] = `${dateTo} 23:59:59`;
            andConditions.push({ created_at: rangeCondition });
          }
          continue;
        }

        if (typeof value !== 'string') continue;
        const terms = splitTerms(value);
        if (terms.length === 0) continue;

        switch (field) {
          case 'identificationNumber': {
            const ors = likeOr('document_number', terms);
            andConditions.push({ [Op.or]: ors });
            break;
          }
          case 'documentType': {
            const upperTerms = terms.map(t => t.toUpperCase());
            andConditions.push({ document_type: { [Op.in]: upperTerms } });
            break;
          }
          case 'email': {
            const ors = likeOr('email', terms);
            andConditions.push({ [Op.or]: ors });
            break;
          }
          case 'phone': {
            const ors = likeOr('phone', terms);
            andConditions.push({ [Op.or]: ors });
            break;
          }
          case 'fullName':
          default: {
            // Cada término busca en first_name OR last_name; los términos se combinan con OR entre sí
            const ors: Record<string, unknown>[] = terms.flatMap(t => [
              { first_name: { [Op.like]: `%${t}%` } },
              { last_name:  { [Op.like]: `%${t}%` } },
            ]);
            andConditions.push({ [Op.or]: ors });
            break;
          }
        }
      }
    } else if (params.q?.trim()) {
      // ── Modo legacy: un solo campo ───────────────────────────
      const q      = params.q.trim();
      const filter = params.filter ?? 'fullName';
      const terms  = splitTerms(q);

      switch (filter) {
        case 'identificationNumber':
          andConditions.push({ document_number: { [Op.like]: `%${q}%` } });
          break;
        case 'documentType':
          andConditions.push({ document_type: { [Op.like]: `%${q.toUpperCase()}%` } });
          break;
        case 'email':
          andConditions.push({ email: { [Op.like]: `%${q}%` } });
          break;
        case 'phone':
          andConditions.push({ phone: { [Op.like]: `%${q}%` } });
          break;
        case 'createdAt':
          andConditions.push({ created_at: { [Op.like]: `%${q}%` } });
          break;
        case 'fullName':
        default: {
          const ors: Record<string, unknown>[] = terms.flatMap(t => [
            { first_name: { [Op.like]: `%${t}%` } },
            { last_name:  { [Op.like]: `%${t}%` } },
          ]);
          andConditions.push({ [Op.or]: ors });
          break;
        }
      }
    }

    const where = { [Op.and]: andConditions };

    const { rows, count } = await UserModel.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit:  pageSize,
      offset,
    });

    const items: AdminUserListItemOutput[] = rows.map((u) => {
      if (!u.document_type) {
        throw new Error(`Invariante violada: el usuario ${u.id} no tiene document_type.`);
      }

      return {
        id:                   u.id,
        firstName:            u.first_name,
        lastName:             u.last_name,
        fullName:             `${u.first_name} ${u.last_name}`,
        documentType:         u.document_type as DocumentType,
        identificationNumber: u.document_number,
        email:                u.email,
        phone:                u.phone ?? undefined,
        role:                 u.role as 'STUDENT' | 'ADMIN',
        createdAt:            u.created_at.toISOString(),
      };
    });

    return {
      items,
      page,
      pageSize,
      total:      count,
      totalPages: Math.ceil(count / pageSize),
    };
  }
}
