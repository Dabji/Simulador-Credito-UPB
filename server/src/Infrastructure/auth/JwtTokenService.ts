// ============================================================
// JWT Token Service
// Implementa ITokenService usando jsonwebtoken.
// ============================================================

import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { ITokenService } from '../../Application/use-cases/AuthenticateUserUseCase';
import { env } from '../config/env';

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
}
