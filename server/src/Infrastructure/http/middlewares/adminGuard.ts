// Middleware: Admin Guard (HU-08)
// Complementa authGuard: verifica que el JWT ya validado
// contenga role === "admin". Si no, responde 403 Forbidden.
// Uso: montar DESPUÉS de authGuard en las rutas /api/admin.

import type { Response, NextFunction } from 'express';
import { ForbiddenError }              from '../../../Core/errors';
import type { AuthenticatedRequest }   from './authGuard';

export function adminGuard(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const role = req.user?.['role'];

  if (role !== 'admin') {
    return next(
      new ForbiddenError('Acceso denegado: se requiere rol de administrador.'),
    );
  }

  next();
}
