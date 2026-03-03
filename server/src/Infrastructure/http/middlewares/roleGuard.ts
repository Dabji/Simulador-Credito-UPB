// ============================================================
// Middleware: roleGuard (HU-07)
// Restringe el acceso a endpoints según los roles permitidos.
// Debe usarse DESPUÉS de authGuard (necesita req.user del JWT).
// ============================================================

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authGuard';
import { ForbiddenError } from '../../../Core/errors';
import { UserRole } from '../../../Core/entities/User';

/**
 * Factory que retorna un middleware de Express.
 * Verifica que el rol del usuario autenticado (extraído del JWT)
 * esté incluido en la lista de roles permitidos.
 *
 * @example
 *   router.use(authGuard, roleGuard(UserRole.ADMIN));
 *   router.use(authGuard, roleGuard(UserRole.STUDENT, UserRole.ADMIN));
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as UserRole | undefined;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(
        new ForbiddenError(
          `Acceso denegado. Se requiere uno de los roles: ${allowedRoles.join(', ')}`,
        ),
      );
    }

    next();
  };
}
