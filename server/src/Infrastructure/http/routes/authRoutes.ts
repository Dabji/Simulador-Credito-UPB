// ============================================================
// Express Routes: Auth
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AuthenticateUserUseCase } from '../../../Application/use-cases/AuthenticateUserUseCase';
import { AppError, BadRequestError, UnauthorizedError } from '../../../Core/errors';
import { SequelizeUserRepository } from '../../persistence/repositories/SequelizeUserRepository';
import { LdapAuthService } from '../../auth/LdapAuthService';
import { JwtTokenService } from '../../auth/JwtTokenService';
import { logger } from '../../logger';

const router = Router();

const userRepository = new SequelizeUserRepository();
const authService = new LdapAuthService();
const tokenService = new JwtTokenService();
const authenticateUseCase = new AuthenticateUserUseCase(
  userRepository,
  authService,
  tokenService,
);

/**
 * POST /api/auth/login
 * Autenticación de usuario vía LDAP/AD
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      throw new BadRequestError('Username y password son requeridos');
    }

    const result = await authenticateUseCase.execute({ username, password });

    logger.info('Usuario autenticado exitosamente', { username });

    res.json({
      user: result.user.toJSON(),
      token: result.token,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new UnauthorizedError('Error de autenticación'));
    }
  }
});

export default router;
