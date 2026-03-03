// ============================================================
// Middleware: roleGuard (HU-07)
// Restringe el acceso a endpoints según los roles permitidos.
// Debe usarse DESPUÉS de authGuard (necesita req.user del JWT).
// ============================================================

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authGuard';
import { ForbiddenError, UnauthorizedError } from '../../../Core/errors';
import { UserRole } from '../../../Core/entities/User';
import { UserModel } from '../../persistence/models/UserModel';

/**
 * Factory que retorna un middleware de Express asíncrono.
 * Verifica que el usuario exista en BD, esté activo y que su rol
 * esté incluido en la lista de roles permitidos.
 *
 * @example
 *   router.use(authGuard, roleGuard(UserRole.ADMIN));
 *   router.use(authGuard, roleGuard(UserRole.STUDENT, UserRole.ADMIN));
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId as string | undefined;

      if (!userId) {
        return next(new UnauthorizedError('No se pudo identificar al usuario autenticado.'));
      }

      const user = await UserModel.findByPk(userId);

      if (!user || !user.is_active) {
        return next(new UnauthorizedError('Cuenta desactivada o usuario inexistente.'));
      }

      const userRole = user.role as UserRole | undefined;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return next(
          new ForbiddenError(
            `Acceso denegado. Se requiere uno de los roles: ${allowedRoles.join(', ')}`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
