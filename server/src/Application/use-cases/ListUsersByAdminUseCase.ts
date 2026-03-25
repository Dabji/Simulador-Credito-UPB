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
    const pageSize = Math.min(Math.max(1, params.pageSize ?? 10), 50);
    const offset   = (page - 1) * pageSize;

    // Condición base
    const andConditions: Record<string, unknown>[] = [{ role: 'STUDENT' }];

    if (params.criteria && params.criteria.length > 0) {
      // ── Modo multi-criterio (HU-PV-03) ──────────────────────
      for (const criterion of params.criteria) {
        const { field, value, dateFrom, dateTo } = criterion;

        if (field === 'createdAt') {
          // Rango de fechas
          const rangeCondition: Record<string, unknown> = {};
          if (dateFrom) rangeCondition[Op.gte as unknown as string] = `${dateFrom} 00:00:00`;
          if (dateTo)   rangeCondition[Op.lte as unknown as string] = `${dateTo} 23:59:59`;
          if (Object.keys(rangeCondition).length > 0) {
            andConditions.push({ created_at: rangeCondition });
          }
          continue;
        }

        const terms = splitTerms(value);
        if (terms.length === 0) continue;

        switch (field) {
          case 'identificationNumber': {
            const ors = likeOr('document_number', terms);
            andConditions.push({ [Op.or as unknown as string]: ors });
            break;
          }
          case 'documentType': {
            const upperTerms = terms.map(t => t.toUpperCase());
            andConditions.push({ document_type: { [Op.in]: upperTerms } });
            break;
          }
          case 'email': {
            const ors = likeOr('email', terms);
            andConditions.push({ [Op.or as unknown as string]: ors });
            break;
          }
          case 'phone': {
            const ors = likeOr('phone', terms);
            andConditions.push({ [Op.or as unknown as string]: ors });
            break;
          }
          case 'fullName':
          default: {
            // Cada término busca en first_name OR last_name; los términos se combinan con OR entre sí
            const ors: Record<string, unknown>[] = terms.flatMap(t => [
              { first_name: { [Op.like]: `%${t}%` } },
              { last_name:  { [Op.like]: `%${t}%` } },
            ]);
            andConditions.push({ [Op.or as unknown as string]: ors });
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
          andConditions.push({ [Op.or as unknown as string]: ors });
          break;
        }
      }
    }

    const where = { [Op.and as unknown as string]: andConditions };

    const { rows, count } = await UserModel.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit:  pageSize,
      offset,
    });

    const items: AdminUserListItemOutput[] = rows.map((u) => ({
      id:                   u.id,
      firstName:            u.first_name,
      lastName:             u.last_name,
      fullName:             `${u.first_name} ${u.last_name}`,
      documentType:         (u.document_type ?? undefined) as 'CC' | 'TI' | undefined,
      identificationNumber: u.document_number,
      email:                u.email,
      phone:                u.phone ?? undefined,
      role:                 u.role as 'STUDENT' | 'ADMIN',
      createdAt:            u.created_at.toISOString(),
    }));

    return {
      items,
      page,
      pageSize,
      total:      count,
      totalPages: Math.ceil(count / pageSize),
    };
  }
}
