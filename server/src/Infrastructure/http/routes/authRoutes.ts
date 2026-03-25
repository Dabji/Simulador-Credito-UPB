// ============================================================
// Express Routes: Auth
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { z } from 'zod';
import { AuthenticateUserUseCase } from '../../../Application/use-cases/AuthenticateUserUseCase';
import { RegisterUserUseCase } from '../../../Application/use-cases/RegisterUserUseCase';
import { GetEmailHintUseCase } from '../../../Application/use-cases/GetEmailHintUseCase';
import { RegisterUserSchema, RegisterUserInputSchema } from '../../../Application/dtos/RegisterUserInput';
import { LoginUserSchema, LoginUserInputSchema } from '../../../Application/dtos/LoginUserInput';
import { ForgotPasswordSchema, ForgotPasswordInputSchema } from '../../../Application/dtos/ForgotPasswordInput';
import { ResetPasswordSchema, ResetPasswordInputSchema } from '../../../Application/dtos/ResetPasswordInput';
import { RecoverHintSchema, RecoverHintInputSchema } from '../../../Application/dtos/RecoverHintInput';
import { ForgotPasswordByIdSchema, ForgotPasswordByIdInputSchema } from '../../../Application/dtos/ForgotPasswordByIdInput';
import { validateRequest } from '../middlewares/validateRequest';
import { RequestPasswordResetUseCase } from '../../../Application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../../Application/use-cases/ResetPasswordUseCase';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../../../Core/errors';
import { authGuard } from '../middlewares/authGuard';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
import { SequelizeUserRepository } from '../../persistence/repositories/SequelizeUserRepository';
import { LdapAuthService } from '../../auth/LdapAuthService';
import { JwtTokenService } from '../../auth/JwtTokenService';
import { logger } from '../../logger';
import { auditLog, extractIp } from '../../../Application/services/AuditService';
import { recoverHintLimiter } from '../middlewares/rateLimitGuard';

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
const getEmailHintUseCase = new GetEmailHintUseCase(userRepository);

/**
 * Middleware que valida el payload de login con Zod y,
 * si la validación falla, registra un evento de auditoría
 * LOGIN_FAILED antes de delegar el error al errorHandler.
 */
const validateLoginRequestWithAudit = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const middleware = validateRequest(LoginUserInputSchema);
    await new Promise<void>((resolve, reject) => {
      middleware(req, _res, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      void auditLog({
        action:     'LOGIN_FAILED',
        entity:     'SESSION',
        entity_id:  'N/A',
        actor_type: 'SYSTEM',
        user_id:    null,
        ip_address: extractIp(req),
        details:    {
          email:  req.body?.email ?? 'unknown',
          role:   req.body?.role  ?? 'unknown',
          reason: 'Datos de login inválidos',
        },
      });
    }
    next(error as Error);
  }
};

/**
 * POST /api/auth/login
 * Autenticación dual: STUDENT (BD + bcrypt) / ADMIN (LDAP)
 */
router.post('/login', validateLoginRequestWithAudit, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body as z.infer<typeof LoginUserSchema>;

    const result = await authenticateUseCase.execute(data);

    logger.info('Usuario autenticado exitosamente', {
      email: data.email,
      role: data.role,
    });

    await auditLog({
      action:     'LOGIN_SUCCESS',
      entity:     'SESSION',
      entity_id:  result.user.id,
      actor_type: data.role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
      user_id:    result.user.id,
      ip_address: extractIp(req),
      details:    { email: data.email, role: data.role },
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
router.post('/register', validateRequest(RegisterUserInputSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body as z.infer<typeof RegisterUserSchema>;

    const newUserId = await registerUseCase.execute(data);

    logger.info('Usuario registrado exitosamente', { email: data.email });

    await auditLog({
      action:     'USER_REGISTERED',
      entity:     'USER',
      entity_id:  newUserId,
      actor_type: 'SYSTEM',
      user_id:    newUserId,
      ip_address: extractIp(req),
      details:    { email: data.email },
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    if (error instanceof ConflictError) {
      void auditLog({
        action:     'USER_REGISTER_FAILED_DUPLICATE_EMAIL',
        entity:     'USER',
        entity_id:  'N/A',
        actor_type: 'SYSTEM',
        user_id:    null,
        ip_address: extractIp(req),
        details:    { email: req.body?.email ?? 'unknown', reason: error.message },
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password
 * Solicita un token de recuperación de contraseña
 */
router.post('/forgot-password', validateRequest(ForgotPasswordInputSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body as z.infer<typeof ForgotPasswordSchema>;

    await requestPasswordResetUseCase.execute(data, {
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
      details:    { email: data.email },
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
router.post('/reset-password', validateRequest(ResetPasswordInputSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body as z.infer<typeof ResetPasswordSchema>;

    await resetPasswordUseCase.execute(data);

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
    const resetReason = (error as { resetTokenReason?: string }).resetTokenReason;
    if (resetReason === 'INVALID') {
      void auditLog({
        action:     'PASSWORD_RESET_TOKEN_INVALID',
        entity:     'USER',
        entity_id:  'N/A',
        actor_type: 'SYSTEM',
        user_id:    null,
        ip_address: extractIp(req),
        details:    { reason: 'Token de recuperación inválido' },
      });
    } else if (resetReason === 'EXPIRED') {
      void auditLog({
        action:     'PASSWORD_RESET_TOKEN_EXPIRED',
        entity:     'USER',
        entity_id:  'N/A',
        actor_type: 'SYSTEM',
        user_id:    null,
        ip_address: extractIp(req),
        details:    { reason: 'Token de recuperación expirado' },
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/recover-hint (HU-PV-04)
 * Retorna el correo enmascarado asociado a un número de identificación.
 * Rate limit: 5 req / 15 min por IP para prevenir enumeración de usuarios.
 */
router.post(
  '/recover-hint',
  recoverHintLimiter,
  validateRequest(RecoverHintInputSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as z.infer<typeof RecoverHintSchema>;

      const result = await getEmailHintUseCase.execute({
        identificationNumber: data.identificationNumber,
      });

      void auditLog({
        action:     'RECOVER_HINT_REQUESTED',
        entity:     'USER',
        entity_id:  'N/A',
        actor_type: 'SYSTEM',
        user_id:    null,
        ip_address: extractIp(req),
        details:    { identificationNumber: data.identificationNumber },
      });

      res.json({ success: true, maskedEmail: result.maskedEmail });
    } catch (error) {
      if (error instanceof NotFoundError) {
        void auditLog({
          action:     'RECOVER_HINT_NOT_FOUND',
          entity:     'USER',
          entity_id:  'N/A',
          actor_type: 'SYSTEM',
          user_id:    null,
          ip_address: extractIp(req),
          details:    { identificationNumber: req.body?.identificationNumber ?? 'unknown' },
        });
      }
      next(error);
    }
  },
);

/**
 * POST /api/auth/forgot-password-by-id (HU-PV-04)
 * Inicia el flujo de recuperación de contraseña usando el número de identificación.
 * Busca el correo real en BD y delega al caso de uso existente.
 * Rate limit: hereda el recoverHintLimiter (5 req / 15 min).
 */
router.post(
  '/forgot-password-by-id',
  recoverHintLimiter,
  validateRequest(ForgotPasswordByIdInputSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as z.infer<typeof ForgotPasswordByIdSchema>;

      const user = await userRepository.findByIdentification(data.identificationNumber);

      if (user) {
        await requestPasswordResetUseCase.execute(
          { email: user.email },
          {
            ip: req.ip,
            userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
          },
        );

        void auditLog({
          action:     'PASSWORD_RESET_REQUESTED_BY_ID',
          entity:     'USER',
          entity_id:  user.id,
          actor_type: 'SYSTEM',
          user_id:    user.id,
          ip_address: extractIp(req),
          details:    { identificationNumber: data.identificationNumber },
        });
      } else {
        logger.warn('Intento de recuperación por ID no registrado', {
          identificationNumber: data.identificationNumber,
        });
      }

      // Siempre retornar éxito (no revelar si la identificación existe)
      res.json({ message: 'Si el número de identificación está registrado, recibirás un enlace de recuperación.' });
    } catch (error) {
      next(error);
    }
  },
);

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
      actor_type: role === 'ADMIN' ? 'ADMIN' : role === 'STUDENT' ? 'STUDENT' : 'SYSTEM',
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
