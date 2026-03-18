// ============================================================
// Express Routes: Admin — Gestión de Usuarios (HU-82)
// GET    /api/admin/users              → listar estudiantes (paginado + filtro)
// GET    /api/admin/users/:id          → perfil de un usuario
// PATCH  /api/admin/users/:id          → editar datos personales
// GET    /api/admin/users/:id/simulations → simulaciones del usuario
// Todos protegidos por authGuard + roleGuard(ADMIN) en app.ts
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
import { SequelizeUserRepository }       from '../../persistence/repositories/SequelizeUserRepository';
import { SequelizeSimulationRepository } from '../../persistence/repositories/SequelizeSimulationRepository';
import { ListUsersByAdminUseCase }        from '../../../Application/use-cases/ListUsersByAdminUseCase';
import type { UserFilterField }           from '../../../Application/use-cases/ListUsersByAdminUseCase';
import { GetUserByAdminUseCase }          from '../../../Application/use-cases/GetUserByAdminUseCase';
import { UpdateUserByAdminUseCase }       from '../../../Application/use-cases/UpdateUserByAdminUseCase';
import { ListUserSimulationsByAdminUseCase } from '../../../Application/use-cases/ListUserSimulationsByAdminUseCase';
import {
  UpdateUserByAdminSchema,
  UpdateUserByAdminInputSchema,
} from '../../../Application/dtos/UpdateUserByAdminInput';
import type { z }                        from 'zod';
import { UnauthorizedError }              from '../../../Core/errors';
import { validateRequest }                from '../middlewares/validateRequest';
import { auditLog, extractIp }            from '../../../Application/services/AuditService';

const router = Router();

const userRepo       = new SequelizeUserRepository();
const simulationRepo = new SequelizeSimulationRepository();

const listUsersUseCase       = new ListUsersByAdminUseCase();
const getUserUseCase         = new GetUserByAdminUseCase(userRepo);
const updateUserUseCase      = new UpdateUserByAdminUseCase(userRepo);
const listSimulationsUseCase = new ListUserSimulationsByAdminUseCase(userRepo, simulationRepo);

const VALID_FILTERS = new Set<UserFilterField>([
  'identificationNumber',
  'documentType',
  'fullName',
  'email',
  'phone',
  'createdAt',
]);

/**
 * GET /api/admin/users
 * HU-82: Listar estudiantes con búsqueda y paginación.
 * Query: q (texto), filter (enum), page, pageSize
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawPage     = Number.parseInt(String(req.query['page']     ?? '1'),  10);
    const rawPageSize = Number.parseInt(String(req.query['pageSize'] ?? '10'), 10);
    const q           = typeof req.query['q']      === 'string' ? (req.query['q']      as string) : undefined;
    const rawFilter   = typeof req.query['filter'] === 'string' ? (req.query['filter'] as string) : undefined;

    const filter: UserFilterField | undefined =
      rawFilter && VALID_FILTERS.has(rawFilter as UserFilterField)
        ? (rawFilter as UserFilterField)
        : undefined;

    const result = await listUsersUseCase.execute({
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
 * GET /api/admin/users/:id
 * HU-82: Perfil completo de un usuario (sin password).
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = String(req.params['id'] ?? '');
    const profile = await getUserUseCase.execute(targetId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id
 * HU-82: Actualiza campos permitidos del perfil de un usuario.
 * Registra auditoría con adminId + targetUserId + campos cambiados.
 */
router.patch(
  '/:id',
  validateRequest(UpdateUserByAdminInputSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId      = req.user?.userId as string | undefined;
      if (!adminId) throw new UnauthorizedError('No se pudo identificar al administrador.');

      const targetUserId = String(req.params['id'] ?? '');
      const data         = req.body as z.infer<typeof UpdateUserByAdminSchema>;

      const before  = await getUserUseCase.execute(targetUserId);
      const updated = await updateUserUseCase.execute(targetUserId, data);

      const changedFields = Object.keys(data);
      await auditLog({
        action:     'ADMIN_USER_UPDATED',
        entity:     'USER',
        entity_id:  targetUserId,
        actor_type: 'ADMIN',
        user_id:    adminId,
        ip_address: extractIp(req),
        details:    {
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
router.get('/:id/simulations', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const simulations = await listSimulationsUseCase.execute(String(req.params['id'] ?? ''));
    res.json({ success: true, data: simulations });
  } catch (error) {
    next(error);
  }
});

export default router;
