// ============================================================
// Middleware: Auth Guard (JWT Verification)
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../auth/JwtTokenService';

const tokenService = new JwtTokenService();

export interface AuthenticatedRequest extends Request {
  user?: Record<string, unknown>;
}

export function authGuard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = tokenService.verify(token);

  if (!payload) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }

  req.user = payload;
  next();
}
