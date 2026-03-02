// ============================================================
// Middleware: roleGuard (HU-07)
// Restringe el acceso a endpoints según los roles permitidos.
// Debe usarse DESPUÉS de authGuard (necesita req.user del JWT).
// ============================================================

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authGuard';
import { ForbiddenError } from '../../../Core/errors';

/**
 * Factory que retorna un middleware de Express.
 * Verifica que el rol del usuario autenticado (extraído del JWT)
 * esté incluido en la lista de roles permitidos.
 *
 * @example
 *   router.use(authGuard, roleGuard('ADMIN'));
 *   router.use(authGuard, roleGuard('STUDENT', 'ADMIN'));
 */
export function roleGuard(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as string | undefined;

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
