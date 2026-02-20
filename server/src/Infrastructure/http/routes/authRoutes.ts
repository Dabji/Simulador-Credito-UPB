// ============================================================
// Express Routes: Auth
// ============================================================

import { Router } from 'express';
import type { Request, Response } from 'express';
import { AuthenticateUserUseCase } from '../../../Application/use-cases/AuthenticateUserUseCase';
import { SequelizeUserRepository } from '../../persistence/repositories/SequelizeUserRepository';
import { LdapAuthService } from '../../auth/LdapAuthService';
import { JwtTokenService } from '../../auth/JwtTokenService';
// Note: relative paths go from http/routes/ -> up 2 to Infrastructure/, then up 1 more to src/

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
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      res.status(400).json({ error: 'Username y password son requeridos' });
      return;
    }

    const result = await authenticateUseCase.execute({ username, password });

    res.json({
      user: result.user.toJSON(),
      token: result.token,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(401).json({ error: message });
  }
});

export default router;
