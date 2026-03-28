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

import { UpdateMyProfileSchema, UpdateMyProfileInputSchema } from '../../../Application/dtos/UpdateMyProfileInput';

import type { z } from 'zod';

import { UnauthorizedError } from '../../../Core/errors';

import { validateRequest } from '../middlewares/validateRequest';

import { UserRole } from '../../../Core/entities/User';

import { auditLog, extractIp } from '../../../Application/services/AuditService';



const router = Router();



const userRepo       = new SequelizeUserRepository();

const simulationRepo = new SequelizeSimulationRepository();



const getMyProfileUseCase      = new GetMyProfileUseCase(userRepo);

const updateMyProfileUseCase   = new UpdateMyProfileUseCase(userRepo);

const listMySimulationsUseCase = new ListMySimulationsUseCase(simulationRepo);



const PII_FIELDS = new Set<string>([

  'identification', 'identificacion', 'document_number', 'documento',

  'phone', 'telefono', 'mobile', 'celular',

]);



function maskPii(field: string, value: unknown): unknown {

  if (!PII_FIELDS.has(field) || value == null) return value;

  const s = String(value);

  return s.length <= 4 ? '*'.repeat(s.length) : s.slice(0, 2) + '***' + s.slice(-2);

}



function auditSubset(

  source: Record<string, unknown> | null | undefined,

  fields: string[],

): Record<string, unknown> {

  const out: Record<string, unknown> = {};

  if (!source) return out;

  for (const f of fields) {

    if (Object.prototype.hasOwnProperty.call(source, f)) {

      out[f] = maskPii(f, source[f]);

    }

  }

  return out;

}



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

router.patch('/me', validateRequest(UpdateMyProfileInputSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {

  try {

    const userId = req.user?.userId as string | undefined;

    if (!userId) throw new UnauthorizedError('No se pudo identificar al usuario.');



    const data = req.body as z.infer<typeof UpdateMyProfileSchema>;



    const profileBefore = await getMyProfileUseCase.execute(userId);

    const updated = await updateMyProfileUseCase.execute(userId, data);



    const changedFields = Object.keys(data);

    await auditLog({

      action:     'PROFILE_UPDATED',

      entity:     'USER',

      entity_id:  userId,

      actor_type: 'STUDENT',

      user_id:    userId,

      ip_address: extractIp(req),

      details:    {

        old_value:      auditSubset(profileBefore as unknown as Record<string, unknown> | null, changedFields),

        new_value:      auditSubset(updated as unknown as Record<string, unknown> | null, changedFields),

        changed_fields: changedFields,

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

