// ============================================================
// Express Routes: Users (HU-81)
// GET  /api/users/me  → perfil del usuario autenticado
// PATCH /api/users/me → actualizar campos permitidos
// GET  /api/users/me/simulations → simulaciones del usuario
// Todos los endpoints usan authGuard + roleGuard(STUDENT).
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import type { AuthenticatedRequest } from '../middlewares/authGuard';
import { SequelizeUserRepository } from '../../persistence/repositories/SequelizeUserRepository';
import { SequelizeSimulationRepository } from '../../persistence/repositories/SequelizeSimulationRepository';
import { GetMyProfileUseCase } from '../../../Application/use-cases/GetMyProfileUseCase';
import { UpdateMyProfileUseCase } from '../../../Application/use-cases/UpdateMyProfileUseCase';
import { ListMySimulationsUseCase } from '../../../Application/use-cases/ListMySimulationsUseCase';
import { UpdateMyProfileSchema } from '../../../Application/dtos/UpdateMyProfileInput';
import { BadRequestError, UnauthorizedError } from '../../../Core/errors';
import { UserRole } from '../../../Core/entities/User';
import { auditLog, extractIp } from '../../../Application/services/AuditService';

const router = Router();

const userRepo       = new SequelizeUserRepository();
const simulationRepo = new SequelizeSimulationRepository();

const getMyProfileUseCase      = new GetMyProfileUseCase(userRepo);
const updateMyProfileUseCase   = new UpdateMyProfileUseCase(userRepo);
const listMySimulationsUseCase = new ListMySimulationsUseCase(simulationRepo);

// Todos los endpoints exigen token válido + rol STUDENT
router.use(authGuard, roleGuard(UserRole.STUDENT));

/**
 * GET /api/users/me
 * HU-81: Retorna el perfil del estudiante autenticado.
 */
router.get('/me', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) throw new UnauthorizedError('No se pudo identificar al usuario.');

    const profile = await getMyProfileUseCase.execute(userId);
    res.json({ user: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/me
 * HU-81: Actualiza campos permitidos del perfil (solo el usuario en sesión).
 */
router.patch('/me', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) throw new UnauthorizedError('No se pudo identificar al usuario.');

    const parsed = UpdateMyProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ');
      throw new BadRequestError(messages);
    }

    const profileBefore = await getMyProfileUseCase.execute(userId);
    const updated = await updateMyProfileUseCase.execute(userId, parsed.data);

    await auditLog({
      action:     'PROFILE_UPDATED',
      entity:     'USER',
      entity_id:  userId,
      actor_type: 'STUDENT',
      user_id:    userId,
      ip_address: extractIp(req),
      details:    {
        old_value: profileBefore,
        new_value: updated,
        changed_fields: Object.keys(parsed.data),
      },
    });

    res.json({ user: updated, message: 'Datos actualizados correctamente.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/me/simulations
 * HU-81: Lista las simulaciones del estudiante autenticado (máx. 20, desc. por fecha).
 */
router.get('/me/simulations', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) throw new UnauthorizedError('No se pudo identificar al usuario.');

    const simulations = await listMySimulationsUseCase.execute(userId);
    res.json({ simulations });
  } catch (error) {
    next(error);
  }
});

export default router;
