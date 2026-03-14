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
import { AppError, BadRequestError, NotFoundError, UnauthorizedError, ValidationError } from '../../../Core/errors';
import { authGuard } from '../middlewares/authGuard';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
import { SequelizeUserRepository } from '../../persistence/repositories/SequelizeUserRepository';
import { LdapAuthService } from '../../auth/LdapAuthService';
import { JwtTokenService } from '../../auth/JwtTokenService';
import { logger } from '../../logger';
import { auditLog, extractIp } from '../../../Application/services/AuditService';

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

    await auditLog({
      action:     'LOGIN_SUCCESS',
      entity:     'SESSION',
      entity_id:  result.user.id,
      actor_type: parsed.data.role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
      user_id:    result.user.id,
      ip_address: extractIp(req),
      details:    { email: parsed.data.email, role: parsed.data.role },
    });

    res.json({
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    await auditLog({
      action:     'LOGIN_FAILED',
      entity:     'SESSION',
      entity_id:  'N/A',
      actor_type: 'SYSTEM',
      user_id:    null,
      ip_address: extractIp(req),
      details:    {
        email:  req.body?.email ?? 'unknown',
        role:   req.body?.role  ?? 'unknown',
        reason: error instanceof Error ? error.message : 'Unknown',
      },
    });

    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Error inesperado durante autenticación', {
        message: error instanceof Error ? error.message : 'Unknown',
        email: req.body?.email,
      });
      next(error);
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
      // Construir errores agrupados por campo (HU-02)
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join('.') || '_form';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      throw new ValidationError('Los datos de registro no son válidos', fieldErrors);
    }

    await registerUseCase.execute(parsed.data);

    logger.info('Usuario registrado exitosamente', { email: parsed.data.email });

    const newUser = await userRepository.findByEmail(parsed.data.email);
    await auditLog({
      action:     'USER_REGISTERED',
      entity:     'USER',
      entity_id:  newUser?.id ?? 'unknown',
      actor_type: 'SYSTEM',
      user_id:    newUser?.id ?? null,
      ip_address: extractIp(req),
      details:    { email: parsed.data.email },
    });

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

    await requestPasswordResetUseCase.execute(parsed.data, {
      ip: req.ip,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    });

    await auditLog({
      action:     'PASSWORD_RESET_REQUESTED',
      entity:     'USER',
      entity_id:  'N/A',
      actor_type: 'SYSTEM',
      user_id:    null,
      ip_address: extractIp(req),
      details:    { email: parsed.data.email },
    });

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

    await auditLog({
      action:     'PASSWORD_RESET_COMPLETED',
      entity:     'USER',
      entity_id:  'N/A',
      actor_type: 'SYSTEM',
      user_id:    null,
      ip_address: extractIp(req),
      details:    { context: 'Token de recuperación utilizado exitosamente' },
    });

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
      throw new NotFoundError('Usuario');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('La cuenta está desactivada');
    }

    const { password: _, ...safeUser } = user.toJSON();
    void _;
    res.json({ user: safeUser });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario autenticado (HU-05).
 * Con JWT stateless no hay token que invalidar del lado del servidor,
 * pero el endpoint permite registrar el evento y podría usarse en el
 * futuro para una lista de revocación (blacklist).
 */
router.post('/logout', authGuard, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    const email  = req.user?.email  as string | undefined;
    const role   = req.user?.role   as string | undefined;

    logger.info('Sesión cerrada', { userId, email });

    await auditLog({
      action:     'LOGOUT',
      entity:     'SESSION',
      entity_id:  userId ?? 'unknown',
      actor_type: role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
      user_id:    userId ?? null,
      ip_address: extractIp(req),
      details:    { email: email ?? 'unknown' },
    });

    res.json({ message: 'Sesión cerrada exitosamente.' });
  } catch (error) {
    next(error);
  }
});

export default router;
