// ============================================================
// JWT Token Service
// Implementa ITokenService usando jsonwebtoken.
// ============================================================

import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { ITokenService } from '../../Application/use-cases/AuthenticateUserUseCase';
import { env } from '../config/env';

export type VerifyResult =
  | { valid: true;  payload: Record<string, unknown> }
  | { valid: false; reason: 'expired' | 'invalid' };

export class JwtTokenService implements ITokenService {
  generate(payload: Record<string, unknown>): string {
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as string & SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  verify(token: string): Record<string, unknown> | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  verifyDetailed(token: string): VerifyResult {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
      return { valid: true, payload };
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return { valid: false, reason: 'expired' };
      }
      return { valid: false, reason: 'invalid' };
    }
  }
}
