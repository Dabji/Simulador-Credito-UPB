// ============================================================
// Middleware: Auth Guard (JWT Verification)
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../../Core/errors';
import { JwtTokenService } from '../../auth/JwtTokenService';

const tokenService = new JwtTokenService();

export interface AuthenticatedRequest extends Request {
  user?: Record<string, unknown>;
}

export function authGuard(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticación requerido'));
  }

  const token = authHeader.slice(7);
  const payload = tokenService.verify(token);

  if (!payload) {
    return next(new UnauthorizedError('Token inválido o expirado'));
  }

  req.user = payload;
  next();
}
