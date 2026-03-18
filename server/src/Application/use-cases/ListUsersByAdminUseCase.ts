// ============================================================
// Use Case: ListUsersByAdminUseCase (HU-82)
// Lista usuarios con paginación y búsqueda por filtro.
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

export interface ListUsersParams {
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

export class ListUsersByAdminUseCase {
  async execute(params: ListUsersParams): Promise<ListUsersResult> {
    const page     = Math.max(1, params.page     ?? 1);
    const pageSize = Math.min(Math.max(1, params.pageSize ?? 10), 50);
    const offset   = (page - 1) * pageSize;
    const q        = params.q?.trim() ?? '';

    // Construir condición WHERE dinámica
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { role: 'STUDENT' };

    if (q) {
      const filter = params.filter ?? 'fullName';
      switch (filter) {
        case 'identificationNumber':
          where['document_number'] = { [Op.like]: `%${q}%` };
          break;
        case 'documentType':
          where['document_type'] = { [Op.like]: `%${q.toUpperCase()}%` };
          break;
        case 'email':
          where['email'] = { [Op.like]: `%${q}%` };
          break;
        case 'phone':
          where['phone'] = { [Op.like]: `%${q}%` };
          break;
        case 'createdAt':
          // Búsqueda por fecha en formato YYYY-MM-DD
          where['created_at'] = { [Op.like]: `%${q}%` };
          break;
        case 'fullName':
        default: {
          // Buscar por nombre o apellido
          where[Op.or as unknown as string] = [
            { first_name: { [Op.like]: `%${q}%` } },
            { last_name:  { [Op.like]: `%${q}%` } },
          ];
          break;
        }
      }
    }

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
