// ============================================================
// Middleware: Auth Guard (JWT Verification)
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../../Core/errors';
import { JwtTokenService } from '../../auth/JwtTokenService';
import { auditLog, extractIp } from '../../../Application/services/AuditService';

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
    void auditLog({
      action:     'TOKEN_MISSING',
      entity:     'SESSION',
      entity_id:  'N/A',
      actor_type: 'SYSTEM',
      user_id:    null,
      ip_address: extractIp(req),
      details:    { reason: 'Token de autenticación no proporcionado', path: req.originalUrl ?? req.path },
    });
    return next(new UnauthorizedError('Token de autenticación requerido'));
  }

  const token = authHeader.slice(7);
  const result = tokenService.verifyDetailed(token);

  if (!result.valid) {
    const isExpired = result.reason === 'expired';
    void auditLog({
      action:     isExpired ? 'SESSION_EXPIRED' : 'TOKEN_REJECTED',
      entity:     'SESSION',
      entity_id:  'N/A',
      actor_type: 'SYSTEM',
      user_id:    null,
      ip_address: extractIp(req),
      details:    {
        reason: isExpired ? 'Token expirado' : 'Token inválido',
        path:   req.originalUrl ?? req.path,
      },
    });
    return next(new UnauthorizedError(isExpired ? 'La sesión ha expirado' : 'Token inválido o expirado'));
  }

  req.user = result.payload;
  next();
}
