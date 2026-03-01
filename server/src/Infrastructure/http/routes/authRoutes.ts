// ============================================================
// Express Routes: Auth
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AuthenticateUserUseCase } from '../../../Application/use-cases/AuthenticateUserUseCase';
import { RegisterUserUseCase } from '../../../Application/use-cases/RegisterUserUseCase';
import { RegisterUserSchema } from '../../../Application/dtos/RegisterUserInput';
import { LoginUserSchema } from '../../../Application/dtos/LoginUserInput';
import { ForgotPasswordSchema } from '../../../Application/dtos/ForgotPasswordInput';
import { ResetPasswordSchema } from '../../../Application/dtos/ResetPasswordInput';
import { RequestPasswordResetUseCase } from '../../../Application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../../Application/use-cases/ResetPasswordUseCase';
import { AppError, BadRequestError, NotFoundError, UnauthorizedError } from '../../../Core/errors';
import { authGuard } from '../middlewares/authGuard';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
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
const requestPasswordResetUseCase = new RequestPasswordResetUseCase(userRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);

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
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password
 * Solicita un token de recuperación de contraseña
 */
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ');
      throw new BadRequestError(messages);
    }

    await requestPasswordResetUseCase.execute(parsed.data);

    // Siempre retornar éxito (no revelar si el email existe)
    res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña usando el token
 */
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = ResetPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ');
      throw new BadRequestError(messages);
    }

    await resetPasswordUseCase.execute(parsed.data);

    logger.info('Contraseña restablecida exitosamente');

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Retorna el usuario autenticado (sin contraseña)
 */
router.get('/me', authGuard, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;

    if (!userId) {
      throw new UnauthorizedError('No se pudo identificar al usuario');
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const { password, ...safeUser } = user.toJSON();
    res.json({ user: safeUser });
  } catch (error) {
    next(error);
  }
});

export default router;
