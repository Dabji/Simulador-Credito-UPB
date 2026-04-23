// ============================================================
// Use Case: AuthenticateUser 
// Lógica dual: STUDENT → BD local + bcrypt
//              ADMIN   → LDAP/AD
// ============================================================

import bcrypt from 'bcrypt';
import { User, UserRole, type DocumentType } from '../../Core/entities/User';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import { UnauthorizedError } from '../../Core/errors';
import type { LoginUserInput } from '../dtos/LoginUserInput';
import { logger } from '../../Infrastructure/logger';

// Interfaz para el servicio de autenticación (LDAP, local, etc.)
export interface IAuthService {
  authenticate(username: string, password: string): Promise<LdapUserData | null>;
}

export interface LdapUserData {
  email: string;
  firstName: string;
  lastName: string;
  identificationNumber: string;
}

export interface AuthenticateUserOutput {
  user: Omit<import('../../Core/entities/User').UserProps, 'password'>;
  token: string;
}

// Interfaz para generación de tokens JWT
export interface ITokenService {
  generate(payload: Record<string, unknown>): string;
  verify(token: string): Record<string, unknown> | null;
}

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthService,
    private readonly tokenService: ITokenService,
  ) {}

  private static readonly DEFAULT_ADMIN_DOCUMENT_TYPE: DocumentType = 'CC';

  async execute(input: LoginUserInput): Promise<AuthenticateUserOutput> {
    if (input.role === 'STUDENT') {
      return this.authenticateStudent(input.email, input.password);
    }
    return this.authenticateAdmin(input.email, input.password);
  }

  // ── Estudiante: buscar en BD local y comparar con bcrypt ──
  private async authenticateStudent(
    email: string,
    password: string,
  ): Promise<AuthenticateUserOutput> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedError(
        'El correo electrónico o la contraseña son incorrectos.',
        'INVALID_CREDENTIALS',
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError(
        'El correo electrónico o la contraseña son incorrectos.',
        'INVALID_CREDENTIALS',
      );
    }

    if (user.role !== UserRole.STUDENT) {
      throw new UnauthorizedError(
        'Esta cuenta es de administrador. Usa la pestaña Administrador para iniciar sesión.',
        'ROLE_MISMATCH',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        'Tu cuenta ha sido desactivada. Contacta al administrador.',
        'ACCOUNT_DISABLED',
      );
    }

    return await this.buildOutput(user);
  }

  // ── Administrador: delegar validación al servicio LDAP ──
  private async authenticateAdmin(
    email: string,
    password: string,
  ): Promise<AuthenticateUserOutput> {
    // Autenticar contra LDAP
    const ldapUser = await this.authService.authenticate(email, password);

    // Si LDAP no autentica, rechazar acceso
    if (!ldapUser) {
      throw new UnauthorizedError(
        'Las credenciales institucionales son inválidas o el usuario no está autorizado.',
        'LDAP_INVALID_CREDENTIALS',
      );
    }

    // Buscar el usuario en la BD local por email
    const user = await this.userRepository.findByEmail(ldapUser.email);

    // Si no existe en BD local, rechazar acceso (no autocrear admins)
    if (!user) {
      throw new UnauthorizedError(
        'No tienes permisos de administrador para este sistema.',
        'ADMIN_NOT_FOUND',
      );
    }

    // Validar que tenga rol ADMIN
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedError(
        'Esta cuenta no tiene permisos de administrador. Usa la pestaña Estudiante para iniciar sesión.',
        'ROLE_MISMATCH',
      );
    }

    // Validar que la cuenta esté activa
    if (!user.isActive) {
      throw new UnauthorizedError(
        'Tu cuenta de administrador ha sido desactivada. Contacta al administrador del sistema.',
        'ACCOUNT_DISABLED',
      );
    }

    // Si todo está correcto, generar JWT y permitir acceso
    return await this.buildOutput(user);
  }

  // ── Genera JWT, actualiza last_login_at y retorna usuario sin password ──
  private async buildOutput(user: User): Promise<AuthenticateUserOutput> {
    // Registrar el momento del login (last_login_at) — fire-and-forget: no bloquea la respuesta
    void this.userRepository.updateLastLogin(user.id).catch((err: unknown) => {
      logger.warn('No se pudo actualizar last_login_at', {
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Excluir password del objeto retornado
    const { password: _, ...userWithoutPassword } = user.toJSON();
    void _;

    return { user: userWithoutPassword, token };
  }
}
