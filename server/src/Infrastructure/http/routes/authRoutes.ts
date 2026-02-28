// ============================================================
// Express Routes: Auth
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AuthenticateUserUseCase } from '../../../Application/use-cases/AuthenticateUserUseCase';
import { RegisterUserUseCase } from '../../../Application/use-cases/RegisterUserUseCase';
import { RegisterUserSchema } from '../../../Application/dtos/RegisterUserInput';
import { LoginUserSchema } from '../../../Application/dtos/LoginUserInput';
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
const registerUseCase = new RegisterUserUseCase(userRepository);

/**
 * POST /api/auth/login
 * Autenticación dual: STUDENT (BD + bcrypt) / ADMIN (LDAP)
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = LoginUserSchema.safeParse(req.body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ');
      throw new BadRequestError(messages);
    }

    const result = await authenticateUseCase.execute(parsed.data);

    logger.info('Usuario autenticado exitosamente', {
      email: parsed.data.email,
      role: parsed.data.role,
    });

    res.json({
      user: result.user,
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

/**
 * POST /api/auth/register
 * Registro de nuevo usuario (HU-01)
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = RegisterUserSchema.safeParse(req.body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ');
      throw new BadRequestError(messages);
    }

    await registerUseCase.execute(parsed.data);

    logger.info('Usuario registrado exitosamente', { email: parsed.data.email });

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(error);
    }
  }
});

export default router;
